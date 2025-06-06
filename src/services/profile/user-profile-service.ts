import axios from "axios";

export class UserProfileService {
    async getUserDetails() {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/pet-owner-profile`, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}