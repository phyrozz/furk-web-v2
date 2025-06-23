import axios from "axios";
import { MerchantProfile } from "../../components/pages/Merchant/MerchantProfilePage";

export class MerchantProfileService {
  async getMerchantDetails() {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/merchant-profile`, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }

    async updateMerchantDetails(merchantProfile: MerchantProfile) {
        const response = await axios.put(import.meta.env.VITE_API_URL + `/merchant-profile`, merchantProfile, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}