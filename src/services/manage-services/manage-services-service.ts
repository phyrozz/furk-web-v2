import { http } from "../../utils/http";

export class ManageServicesService {
    async listServices(limit: number, offset: number, keyword: string): Promise<any> {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        return http.post('/merchant-service/list', data);
    }

    async deleteService(formData: any): Promise<any> {
        const data = {
            id: formData.id
        };

        return http.post('/merchant-service/delete', data);
    }
  }