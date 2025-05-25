import axios from "axios";

export class ManageServicesService {
    async listServices(limit: number, offset: number, keyword: string) {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-service/list", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken')
            }
        });
        return response.data;
    }

    async deleteService(formData: any) {
        const data = {
            id: formData.id
        };

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-service/delete", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoAccessToken')
            }
        });
        return response.data;
    }
  }