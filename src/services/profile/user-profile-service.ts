import { UserProfile } from "../../components/pages/Profile/ProfilePage";
import { PetProfile } from "../../components/pages/Profile/PetProfiles";
import { http } from "../../utils/http";

export class UserProfileService {
    async getUserDetails() {
        return http.get('/pet-owner-profile');
    }

    async updateUserDetails(userDetails: UserProfile) {
        return http.put('/pet-owner-profile', userDetails);
    }

    async listBookingHistory(limit: number, offset: number) {
        return http.post('/pet-owner-profile/list-bookings', {
            limit: limit,
            offset: offset
        });
    }

    async listFavorites(limit: number, offset: number) {
        return http.post('/favorite/list', {
            limit: limit,
            offset: offset
        });
    }

    async listPetProfiles(limit: number, offset: number) {
        return http.post('/pets/list', {
            limit: limit,
            offset: offset
        });
    }

    async addPetProfile(petProfile: PetProfile) {
        for (const key in petProfile) {
            if ((petProfile as any)[key] === '') {
                (petProfile as any)[key] = null;
            }
        }
        return http.post('/pets/add', petProfile);
    }

    async updatePetProfile(petProfile: PetProfile) {
        return http.post(`/pets/update/${petProfile.id}`, petProfile);
    }

    async deletePetProfile(petProfileId: string) {
        return http.delete(`/pets/delete/${petProfileId}`);
    }
}