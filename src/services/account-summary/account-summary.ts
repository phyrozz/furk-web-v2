import type { UserWallet } from '../../models/user-wallet';
import { http } from '../../utils/http';
import { CachedResource } from './cached-resource';

export const DEFAULT_AVATAR = '/default_profile.png';

export function profileImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return DEFAULT_AVATAR;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${(import.meta.env.VITE_CDN_URL || '').replace(/\/+$/, '')}/${imageUrl.replace(/^\/+/, '')}`;
}

export const accountWallet = new CachedResource(async () => {
  const response = await http.get<{ data: UserWallet }>('/pet-owner-profile/get-user-wallet');
  return response.data;
});

export const accountAvatar = new CachedResource(async () => {
  const response = await http.get<{ data: { image_url?: string | null } }>('/pet-owner-profile');
  return profileImageUrl(response.data.image_url);
});

export function resetAccountSummary() {
  accountWallet.reset();
  accountAvatar.reset();
}
