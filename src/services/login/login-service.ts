import axios from 'axios';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, confirmSignIn, SignInOutput, signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || ''
    }
  }
});

interface LoginCredentials {

  email: string | undefined;
  phone: string | undefined;
  password: string;
}

interface SignUpCredentials {
  email: string | undefined;
  phone: string | undefined;
  firstName: string;
  lastName: string;
  password: string;
  userType: 'user' | 'merchant';
}

interface SignUpResponse {
  data?: any;
  message?: string;
  role_name?: string | null;
  token?: string;
}

interface LoginResponse {
  data?: any;
  token?: string;
  role?: 'user' | 'merchant' | 'admin';
  message?: string;
}

interface CognitoTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

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

  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      // Login to Cognito
      const cognitoUser = await signIn({
        username: credentials.email || credentials.phone!,
        password: credentials.password
      });
      console.log('Cognito user:', cognitoUser);

      if (cognitoUser.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return {
          message: 'New password required'
        }
      }

      const session = await fetchAuthSession();

      const tokens = {
        accessToken: session.tokens?.accessToken.toString() || '',
        idToken: session.tokens?.idToken?.toString() || '',
        refreshToken: ''
      };

      // get the username from the access token
      const username = session.tokens?.accessToken.payload.username;
      console.log('Username:', username);

      // Login to backend API
      const response = await axios.get<LoginResponse>(
        `${this.baseUrl}/login`,
        {
          headers: {
            Authorization: `${tokens.accessToken}`
          }
        }
      );
      
      // Store tokens and role name in localStorage
      localStorage.setItem('token', response.data.token!);
      localStorage.setItem('cognitoAccessToken', tokens.accessToken);
      localStorage.setItem('cognitoIdToken', tokens.idToken);
      localStorage.setItem('cognitoRefreshToken', tokens.refreshToken);
      localStorage.setItem('roleName', response.data.role!);
      
      return response.data;
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async resetPassword(credentials: LoginCredentials, newPassword: string): Promise<LoginResponse> {
    // Reset password in Cognito
    const signInResult = await signIn({
      username: credentials.email || credentials.phone!,
      password: credentials.password
    });

    if (signInResult.nextStep?.signInStep !== 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      throw new Error('Password reset not required for this user');
    }

    await confirmSignIn({
      challengeResponse: newPassword,
    });

    // Refresh session to get new tokens
    const session = await fetchAuthSession();
    const tokens = {
      accessToken: session.tokens?.accessToken.toString() || '',
      idToken: session.tokens?.idToken?.toString() || '',
      refreshToken: ''
    };

    // Store tokens in localStorage
    localStorage.setItem('cognitoAccessToken', tokens.accessToken);
    localStorage.setItem('cognitoIdToken', tokens.idToken);
    localStorage.setItem('cognitoRefreshToken', tokens.refreshToken);

    // get the username from the access token
    const username = session.tokens?.accessToken.payload.username;

    // Login to backend API
    const response = await axios.get<LoginResponse>(
      `${this.baseUrl}/login?username=${username}`,
      {
        headers: {
          Authorization: `${tokens.accessToken}`
        }
      }
    );

    // Store tokens and role name in localStorage
    localStorage.setItem('token', response.data.token!);
    localStorage.setItem('roleName', response.data.role!);
    return response.data;
  }

  public async logout(): Promise<void> {
    try {
      // Sign out from Cognito
      await signOut();
      
      // Clear all tokens
      localStorage.removeItem('token');
      localStorage.removeItem('cognitoAccessToken');
      localStorage.removeItem('cognitoIdToken');
      localStorage.removeItem('cognitoRefreshToken');
      localStorage.removeItem('roleName');
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  public async signUp(credentials: SignUpCredentials): Promise<LoginResponse> {
    try {
      if (!credentials.email && !credentials.phone) {
        throw new Error('Email or phone number is required');
      }
  
      if (credentials.phone && credentials.phone.startsWith('0')) {
        credentials.phone = `+63${credentials.phone.substring(1)}`;
      }
  
      console.log('Signing up with credentials:', credentials);
  
      const cognitoUser = await signUp({
        username: credentials.email || credentials.phone!,
        password: credentials.password,
        options: {
          userAttributes: {
            email: credentials.email,
            phone_number: credentials.phone
          }
        }
      });
  
      console.log('Cognito user:', cognitoUser);
  
      const response = await axios.post<SignUpResponse>(
        `${this.baseUrl}/login`,
        {
          username: credentials.email || credentials.phone!,
          email: credentials.email,
          phone_number: credentials.phone,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          role_id: credentials.userType === 'user' ? 1 : 3
        }
      );
  
      console.log('Backend response:', response.data);
  
      localStorage.setItem('token', response.data.token!);
      localStorage.setItem('userRole', response.data.role_name!);
  
      return {
        message: 'Sign up successful'
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

  public isAuthenticated(): boolean {
    return !!(localStorage.getItem('token') && localStorage.getItem('cognitoAccessToken'));
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getCognitoAccessToken(): string | null {
    return localStorage.getItem('cognitoAccessToken');
  }

  private getCognitoTokens(cognitoUser: any): CognitoTokens {
    const session = cognitoUser.signInUserSession;
    return {
      accessToken: session.accessToken.jwtToken,
      idToken: session.idToken.jwtToken,
      refreshToken: session.refreshToken.token
    };
  }

  public async refreshSession(): Promise<void> {
    try {
      const session = await fetchAuthSession();
      if (session.tokens) {
        localStorage.setItem('cognitoAccessToken', session.tokens.accessToken.toString());
        localStorage.setItem('cognitoIdToken', session.tokens.idToken?.toString() || '');
      }
    } catch (error) {
      throw this.handleCognitoError(error);
    }
  }

  private handleCognitoError(error: any): Error {
    if (axios.isAxiosError(error)) {
      localStorage.clear();

      return new Error(error.response?.data?.message || 'An error occurred during authentication');
    }

    const authError = error as AuthError;
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
