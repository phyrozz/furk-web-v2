import { http } from "../../utils/http";

export class MerchantVerificationService {
    async submitMerchantApplicationDetails(formData: any): Promise<any> {
        const serviceGroupIds = formData.serviceGroups.map((group: any) => group.id);

        console.log('Form data: ', formData);

        return http.post('/merchant-application', {
            service_group_ids: serviceGroupIds,
            business_name: formData.businessName,
            merchant_type: formData.merchantType,
            long: formData.long,
            lat: formData.lat,
            province: formData.province,
            city: formData.city,
            barangay: formData.barangay,
            address: formData.address
        });
    }

    async listServiceGroups(limit: number, offset: number, keyword: string): Promise<any> {
        return http.post('/merchant-service/list-service-groups', {
            limit: limit,
            offset: offset,
            keyword: keyword
        });
    }
  }