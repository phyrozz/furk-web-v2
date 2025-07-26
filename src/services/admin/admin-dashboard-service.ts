import { http } from "../../utils/http";

export class AdminDashboardService {
    async listServices(limit: number, offset: number, keyword: string, status: string): Promise<any> {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword,
            status: status
        }

        return http.post('/merchant-application/list', data);
    }

    async approveService(applicationId: string): Promise<any> {
        return http.post('/merchant-application/approve', { application_id: applicationId });
    }

    async rejectService(applicationId: string): Promise<any> {
        return http.post('/merchant-application/reject', { application_id: applicationId });
    }
}