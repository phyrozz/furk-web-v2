import { PET_OWNER_TOUR_PREFIX } from '../../utils/pet-owner-tour';
import { THEME_STORAGE_KEY } from '../../theme/theme';
import { resetAccountSummary } from '../account-summary/account-summary';

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

  setHasBusinessHours(hasBusinessHours: boolean): void {
    localStorage.setItem('hasBusinessHours', hasBusinessHours.toString());
  }

  getHasBusinessHours(): boolean | null {
    const hasBusinessHours = localStorage.getItem('hasBusinessHours');
    if (hasBusinessHours === null) {
      return null;
    }
    return hasBusinessHours === 'true';
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
    resetAccountSummary();
    localStorage.removeItem(this.MERCHANT_STATUS_KEY);
    localStorage.removeItem(this.ROLE_NAME_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('cognitoAccessToken');
    localStorage.removeItem('cognitoIdToken');
    localStorage.removeItem('hasBusinessHours');
  }

  clearAll(): void {
    resetAccountSummary();
    const themePreference = localStorage.getItem(THEME_STORAGE_KEY);
    const tourSeen = localStorage.getItem('furk_merchant_tour_seen');
    const verifiedNoticeSeen = localStorage.getItem('furk_merchant_verified_dashboard_notice_seen');
    const petOwnerTourSeen = localStorage.getItem('furk_pet_owner_tour_seen');
    const affiliateTourSeen = localStorage.getItem('furk_affiliate_tour_seen');
    const petOwnerTours = Object.keys(localStorage)
      .filter(key => key.startsWith(PET_OWNER_TOUR_PREFIX))
      .map(key => [key, localStorage.getItem(key)] as const);
    localStorage.clear();
    if (themePreference) {
      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    }
    for (const [key, value] of petOwnerTours) {
      if (value) localStorage.setItem(key, value);
    }
    if (tourSeen) {
      localStorage.setItem('furk_merchant_tour_seen', tourSeen);
    }
    if (verifiedNoticeSeen) {
      localStorage.setItem('furk_merchant_verified_dashboard_notice_seen', verifiedNoticeSeen);
    }
    if (petOwnerTourSeen) {
      localStorage.setItem('furk_pet_owner_tour_seen', petOwnerTourSeen);
    }
    if (affiliateTourSeen) {
      localStorage.setItem('furk_affiliate_tour_seen', affiliateTourSeen);
    }
  }
}
