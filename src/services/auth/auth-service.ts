import axios from 'axios';
import { Amplify } from 'aws-amplify';
import { 
  signIn, 
  signOut, 
  fetchAuthSession, 
  signUp, 
  confirmSignUp, 
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser
} from 'aws-amplify/auth';
import { ToastService } from '../toast/toast-service';
import { roleMapping } from '../../utils/role-mapping';
import { http } from '../../utils/http';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
      identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || ''
    }
  }
});

interface LoginCredentials {
  userType: 'user' |'merchant' | 'admin' | 'affiliate';
  email: string;
  password: string;
}

interface SignUpCredentials {
  email: string | undefined;
  phone: string | undefined;
  firstName: string;
  lastName: string;
  password: string;
  userType: 'user' | 'merchant' | 'affiliate';
  referralCode?: string | null;
}

interface SignUpResponse {
  data?: any;
  message?: string;
}

interface LoginResponse {
  data?: any;
  token?: string;
  role?: 'user' | 'merchant' | 'admin';
  message?: string;
}

// interface CognitoTokens {
//   accessToken: string;
//   idToken: string;
//   refreshToken: string;
// }

interface AuthError {
  name: string;
  message: string;
  code?: string;
}

export class LoginService {
  private static instance: LoginService;
  private baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private constructor() {}

  public static getInstance(): LoginService {
    if (!LoginService.instance) {
      LoginService.instance = new LoginService();
    }
    return LoginService.instance;
  }

  public async getCurrentUser(): Promise<any> {
    try {
      const user = await getCurrentUser();
      return user;
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Login to Cognito
      const cognitoUser = await signIn({
        username: credentials.email,
        password: credentials.password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH'
        }
      });
      // console.log('Cognito user:', cognitoUser);

      if (cognitoUser.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return {
          message: 'New password required'
        }
      }

      if (cognitoUser.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        return {
          message: 'User is not confirmed'
        }
      }

      const session = await fetchAuthSession({ forceRefresh: true });

      const tokens = {
        accessToken: session.tokens?.accessToken.toString() || '',
        idToken: session.tokens?.idToken?.toString() || '',
        refreshToken: ''
      };

      // get the username from the access token
      // const username = session.tokens?.accessToken.payload.username;
      // console.log('Username:', username);

      // Login to backend API
      const response = await axios.get<LoginResponse>(
        `${this.baseUrl}/login`,
        {
          headers: {
            Authorization: `${tokens.idToken}`
          }
        }
      );

      const responseData = response.data.data;

      if (responseData.role !== credentials.userType && !(responseData.role === 'admin' && credentials.userType === 'user')) {
        throw new Error('User type mismatch');
      }
      
      // Store tokens and role name in localStorage
      localStorage.setItem('token', responseData.token!);
      localStorage.setItem('cognitoAccessToken', tokens.accessToken);
      localStorage.setItem('cognitoIdToken', tokens.idToken);
      // localStorage.setItem('cognitoRefreshToken', tokens.refreshToken);
      localStorage.setItem('roleName', responseData.role!);
      localStorage.setItem('merchantStatus', responseData.merchant_status!);
      localStorage.setItem('hasBusinessHours', responseData.has_business_hours!);
      
      return response.data;
    } catch (error: any) {
      throw this.handleCognitoError(error);
    }
  }

  public async sendResetPasswordCode(username: string): Promise<LoginResponse> {
    // Send reset password code to Cognito
    await resetPassword({
      username: username
    });
    return {
      message: 'Reset password code sent'
    }
  }

  public async resetPassword(username: string, confirmationCode: string, newPassword: string): Promise<LoginResponse> {
    // Reset password in Cognito
    await confirmResetPassword({
      username: username,
      confirmationCode: confirmationCode,
      newPassword: newPassword
    });

    return {
      message: 'Password reset successful'
    }
  }

  public async logout(): Promise<void> {
    try {
      // Sign out from Cognito
      await signOut();
      
      // Clear all tokens
      localStorage.clear();
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async signUp(credentials: SignUpCredentials): Promise<LoginResponse> {
    try {
      if (!credentials.email) {
        throw new Error('Email is required');
      }
  
      if (credentials.phone && credentials.phone.startsWith('0')) {
        credentials.phone = `+63${credentials.phone.substring(1)}`;
      }
  
      // console.log('Signing up with credentials:', credentials);

      // if sign up includes an affiliate id (referral code), validate first before creating a cognito user
      if (credentials.referralCode) {
        const response: { success: boolean, data: any, message: string } = await http.publicPost('/login/validate-merchant', {
          referral_code: credentials.referralCode
        })

        if (!response.success || !response.data.is_affiliate_valid) {
          throw new Error('Invalid affiliate code');
        }
      }
  
      const cognitoUser = await signUp({
        username: credentials.email,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
            phone_number: credentials.phone
          }
        }
      });
  
      // console.log('Cognito user:', cognitoUser);
  
      const response = await axios.post<SignUpResponse>(
        `${this.baseUrl}/login`,
        {
          username: credentials.email,
          email: credentials.email,
          phone_number: credentials.phone,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          role_id: roleMapping[credentials.userType],
          ...(credentials.referralCode && { referral_code: credentials.referralCode })
        }
      );

      const responseData = response.data.data;

      if (responseData.role_name !== credentials.userType) {
        throw new Error('User type mismatch');
      }
  
      return {
        message: 'Sign up successful',
        data: responseData,
      }
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async verifySignUp(username: string, code: string): Promise<LoginResponse> {
    try {
      await confirmSignUp({
        username: username,
        confirmationCode: code
      });
      return {
        message: 'Sign up successful'
      }
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async resendVerificationCode(username: string): Promise<LoginResponse> {
    try {
      await resendSignUpCode({
        username: username
      });
      return {
        message: 'Verification code resent'
      }
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      const authSession = await fetchAuthSession();
      const roleName = localStorage.getItem('roleName');

      if (!authSession || !roleName) {
        return false;
      }

      console.log('Checking session...');

      // check if the auth session token is still valid
      const tokens = authSession.tokens;
      if (!tokens || !tokens.idToken) {
        return false;
      }

      const idToken = tokens.idToken;
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime >= (idToken?.payload?.exp ?? 0)) {
        try {
          // Try to refresh the session
          await this.refreshSession();
          return true;
        } catch (refreshError: any) {
          console.error('Error refreshing session:', refreshError);
          
          // Check if the refresh token is expired or invalid
          if (refreshError.name === 'TokenException' || 
              refreshError.message?.includes('refresh token has expired') ||
              refreshError.message?.includes('Invalid refresh token')) {
            await this.logout();
            ToastService.show('Your session has expired. Please login again.');
          } else {
            localStorage.clear();
            ToastService.show('Session expired. Please login again.');
          }
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error parsing token:', error);
      return false;
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getCognitoAccessToken(): string | null {
    return localStorage.getItem('cognitoAccessToken');
  }

  public getUserRole(): string | null {
    return localStorage.getItem('roleName');
  }

  public async refreshSession(): Promise<void> {
    try {
      const session = await fetchAuthSession({forceRefresh: true});
      if (session.tokens) {
        const tokens = {
          accessToken: session.tokens.accessToken.toString(),
          idToken: session.tokens.idToken?.toString() || ''
        };

        localStorage.setItem('cognitoAccessToken', tokens.accessToken);
        localStorage.setItem('cognitoIdToken', tokens.idToken);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      throw error;
    }
  }

  private handleCognitoError(error: any): Error {
    // if (axios.isAxiosError(error)) {
    //   localStorage.clear();

    //   return new Error(error.response?.data?.message || 'An error occurred during authentication');
    // }
    
    // Only clear localStorage for authentication errors, not for network errors
    const authError = error as AuthError;

    // // Only clear tokens for actual auth errors, not temporary issues
    // if (authError.code && [
    //   'NotAuthorizedException',
    //   'UserNotFoundException',
    //   'UserNotConfirmedException',
    //   'PasswordResetRequiredException'
    // ].includes(authError.code)) {
    //   localStorage.clear();
    // }
    localStorage.clear();

    switch (authError.code) {
      case 'NotAuthorizedException':
        return new Error('Incorrect username or password');
      case 'UserNotFoundException':
        return new Error('User does not exist');
      case 'UserNotConfirmedException':
        return new Error('User is not confirmed');
      case 'PasswordResetRequiredException':
        return new Error('Password reset required');
      case 'LimitExceededException':
        return new Error('Attempt limit exceeded, please try again later');
      case 'InvalidParameterException':
        return new Error('Invalid parameters provided');
      case 'InvalidPasswordException':
        return new Error('Password does not meet requirements');
      case 'ExpiredCodeException':
        return new Error('Verification code has expired');
      case 'CodeMismatchException':
        return new Error('Invalid verification code');
      default:
        return new Error(authError.message || 'An unexpected error occurred');
    }
  }
}

export const loginService = LoginService.getInstance();
