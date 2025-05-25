import axios from "axios";

export class MerchantVerificationService {
    async submitMerchantApplicationDetails() {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application", {}, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken')
            }
        });
        return response.data;
    }
  }