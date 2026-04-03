import { http } from "../../utils/http";

export class AddServiceService {
    async listServiceCategories(limit: number, offset: number, keyword: string): Promise<any> {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        return http.post('/merchant-service/list-service-categories', data);
    }

    async insertService(formData: any): Promise<any> {
        const data = {
            service_category_id: formData.category.id,
            merchant_service_category_id: formData.merchantCategory.id,
            name: formData.name.trim(),
            description: formData.description.trim(),
            price: formData.price,
            duration: formData.duration,
            payout_per_completion: formData.payoutPerCompletion,
            requires_pet: formData.requiresPet
        };

        return http.post('/merchant-service/insert', data);
    }
  }
