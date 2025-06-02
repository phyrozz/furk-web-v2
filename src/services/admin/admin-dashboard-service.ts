import axios from "axios";

export class AdminDashboardService {
    async listServices(limit: number, offset: number, keyword: string, status: string) {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword,
            status: status
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application/list", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }

    async approveService(applicationId: string) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application/approve", {
            application_id: applicationId
        }, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }

    async rejectService(applicationId: string) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant-application/reject", {
            application_id: applicationId
        }, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }
}