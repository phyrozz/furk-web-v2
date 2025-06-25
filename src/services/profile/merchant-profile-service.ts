import axios from 'axios';
import { MerchantProfile } from "../../components/pages/Merchant/MerchantProfilePage";
import { BusinessHour } from '../../components/pages/Merchant/SetBusinessHours/SetBusinessHoursPage';

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

    async updateMerchantBusinessHours(businessHours: BusinessHour[]) {
        const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant-profile/business-hours`, {
            data: businessHours
        }, {
            headers: {
                "Authorization": localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}