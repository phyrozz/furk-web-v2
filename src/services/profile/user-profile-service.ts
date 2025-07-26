import { UserProfile } from "../../components/pages/Profile/ProfilePage";
import { PetProfile } from "../../components/pages/Profile/PetProfiles";
import { http } from "../../utils/http";

export class UserProfileService {
    async getUserDetails(): Promise<any> {
        return http.get('/pet-owner-profile');
    }

    async updateUserDetails(userDetails: UserProfile): Promise<any> {
        return http.put('/pet-owner-profile', userDetails);
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

    async updatePetProfile(petProfile: PetProfile): Promise<any> {
        return http.post(`/pets/update/${petProfile.id}`, petProfile);
    }

    async deletePetProfile(petProfileId: string): Promise<any> {
        return http.delete(`/pets/delete/${petProfileId}`);
    }
}