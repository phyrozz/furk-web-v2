import axios from "axios";

export class PetServicesService {
    async listServices(limit: number, offset: number, keyword: string) {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/pet-services/list", data);
        return response.data;
    }

    async getServiceDetails(id: number) {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/pet-services/get/${id}`);
        return response.data;
    }
}