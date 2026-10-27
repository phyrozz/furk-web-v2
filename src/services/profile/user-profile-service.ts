import { UserProfile } from "../../components/pages/Profile/ProfilePage";
import { PetProfile } from "../../components/pages/Profile/PetProfiles";
import { http } from "../../utils/http";
import { accountAvatar, accountWallet, profileImageUrl } from '../account-summary/account-summary';

export class UserProfileService {
    async getUserDetails(): Promise<any> {
        const session = accountAvatar.getSession();
        const response = await http.get<{ data: UserProfile }>('/pet-owner-profile');
        accountAvatar.set(profileImageUrl(response.data.image_url), session);
        return response;
    }

    async updateUserDetails(userDetails: UserProfile): Promise<any> {
        return http.put('/pet-owner-profile', userDetails);
    }

    async generateProfileImageUploadUrl(contentType: string): Promise<any> {
        return http.post('/pet-owner-profile/profile-image/upload-url', {
            content_type: contentType
        });
    }

    async updateProfileImage(profileImageKey: string): Promise<any> {
        const session = accountAvatar.getSession();
        const response = await http.put('/pet-owner-profile/profile-image', {
            profile_image_key: profileImageKey
        });
        if (session === accountAvatar.getSession()) accountAvatar.invalidate();
        return response;
    }

    async listBookingHistory(limit: number, offset: number): Promise<any> {
        return http.post('/pet-owner-profile/list-bookings', {
            limit: limit,
            offset: offset
        });
    }

    async listFavorites(limit: number, offset: number): Promise<any> {
        return http.post('/favorite/list', {
            limit: limit,
            offset: offset
        });
    }

    async listPetProfiles(limit: number, offset: number): Promise<any> {
        return http.post('/pets/list', {
            limit: limit,
            offset: offset
        });
    }

    async addPetProfile(petProfile: PetProfile): Promise<any> {
        for (const key in petProfile) {
            if ((petProfile as any)[key] === '') {
                (petProfile as any)[key] = null;
            }
        }
        return http.post('/pets/add', petProfile);
    }

    async getPetQrCode(petProfileId: string): Promise<any> {
        return http.get(`/pets/get-qr/${petProfileId}`);
    }

    async updatePetProfile(petProfile: PetProfile): Promise<any> {
        return http.post(`/pets/update/${petProfile.id}`, petProfile);
    }

    async deletePetProfile(petProfileId: string): Promise<any> {
        return http.delete(`/pets/delete/${petProfileId}`);
    }

    async listTransactionHistory(limit: number, offset: number): Promise<any> {
        return http.post('/pet-owner-profile/list-transactions', {
            limit: limit,
            offset: offset
        });
    }

    async cancelBooking(bookingId: number): Promise<any> {
        const session = accountWallet.getSession();
        const response = await http.post(`/pet-owner-profile/cancel-booking/${bookingId}`);
        if (session === accountWallet.getSession()) accountWallet.invalidate();
        return response;
    }

    async deleteAccount(id: number): Promise<any> {
        return http.delete(`/pet-owner-profile/delete-account/${id}`);
    }
}
