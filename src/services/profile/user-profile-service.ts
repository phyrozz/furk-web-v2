import axios from "axios";
import { UserProfile } from "../../components/pages/Profile/ProfilePage";
import { PetProfile } from "../../components/pages/Profile/PetProfiles";

export class UserProfileService {
    async getUserDetails() {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/pet-owner-profile`, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async updateUserDetails(userDetails: UserProfile) {
        const response = await axios.put(import.meta.env.VITE_API_URL + `/pet-owner-profile`, userDetails, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async listBookingHistory(limit: number, offset: number) {
        const response = await axios.post(import.meta.env.VITE_API_URL + `/pet-owner-profile/list-bookings`, {
            limit: limit,
            offset: offset
        }, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async listFavorites(limit: number, offset: number) {
        const response = await axios.post(import.meta.env.VITE_API_URL + `/favorite/list`, {
            limit: limit,
            offset: offset
        }, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async listPetProfiles(limit: number, offset: number) {
        const response = await axios.post(import.meta.env.VITE_API_URL + `/pets/list`, {
            limit: limit,
            offset: offset
        }, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async addPetProfile(petProfile: PetProfile) {
        for (const key in petProfile) {
            if ((petProfile as any)[key] === '') {
                (petProfile as any)[key] = null;
            }
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + `/pets/add`, petProfile, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async updatePetProfile(petProfile: PetProfile) {
        const response = await axios.post(import.meta.env.VITE_API_URL + `/pets/update/${petProfile.id}`, petProfile, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async deletePetProfile(petProfileId: string) {
        const response = await axios.delete(import.meta.env.VITE_API_URL + `/pets/delete/${petProfileId}`, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}