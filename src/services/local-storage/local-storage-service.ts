export class LocalStorageService {
  private readonly MERCHANT_STATUS_KEY = 'merchantStatus';
  private readonly ROLE_NAME_KEY = 'roleName';
  private readonly TOKEN_KEY = 'token';

  setMerchantStatus(status: string): void {
    localStorage.setItem(this.MERCHANT_STATUS_KEY, status);
  }

  getMerchantStatus(): string | null {
    return localStorage.getItem(this.MERCHANT_STATUS_KEY);
  }

  setRoleName(role: string): void {
    localStorage.setItem(this.ROLE_NAME_KEY, role);
  }

  getRoleName(): string | null {
    return localStorage.getItem(this.ROLE_NAME_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearStorage(): void {
    localStorage.removeItem(this.MERCHANT_STATUS_KEY);
    localStorage.removeItem(this.ROLE_NAME_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  clearAll(): void {
    localStorage.clear();
  }
}
