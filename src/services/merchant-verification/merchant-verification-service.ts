import axios from "axios";

export class MerchantVerificationService {
    async submitMerchantApplicationDetails(formData: any) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application", {
            service_group_id: formData.serviceGroupId,
            business_name: formData.businessName,
        }, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }

    async listServiceGroups(limit: number, offset: number, keyword: string) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-service/list-service-groups", {
            limit: limit,
            offset: offset,
            keyword: keyword
        }, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }
  }