import axios from "axios";

export class AddServiceService {
    async listServiceCategories(limit: number, offset: number, keyword: string) {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-service/list-service-categories", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken')
            }
        });
        return response.data;
    }

    async insertService(formData: any) {
        const data = {
            service_category_id: formData.category.id,
            name: formData.name,
            description: formData.description,
            price: formData.price
        };

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-service/insert", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken'),
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    }
  }