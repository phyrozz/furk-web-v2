import axios from "axios";

export class AdminDashboardService {
    async listServices(limit: number, offset: number, keyword: string) {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application/list", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }
}