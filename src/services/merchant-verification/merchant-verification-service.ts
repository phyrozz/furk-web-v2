import axios from "axios";

export class MerchantVerificationService {
    async submitMerchantApplicationDetails(formData: any) {
        const serviceGroupIds = formData.serviceGroups.map((group: any) => group.id);

        console.log('Form data: ', formData);
        
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application", {
            service_group_ids: serviceGroupIds,
            business_name: formData.businessName,
            merchant_type: formData.merchantType,
            long: formData.long,
            lat: formData.lat,
            province: formData.province,
            city: formData.city,
            barangay: formData.barangay,
            address: formData.address
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