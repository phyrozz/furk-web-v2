import axios from "axios";

export class MerchantVerificationService {
    async submitMerchantApplicationDetails(data: any) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken')
            }
        });
        return response.data;
    }
  }