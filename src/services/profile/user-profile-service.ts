import axios from "axios";
import { UserProfile } from "../../components/pages/Profile/ProfilePage";

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
}