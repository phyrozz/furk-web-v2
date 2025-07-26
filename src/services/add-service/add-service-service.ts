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
            name: formData.name,
            description: formData.description,
            price: formData.price
        };

        return http.post('/merchant-service/insert', data);
    }
  }