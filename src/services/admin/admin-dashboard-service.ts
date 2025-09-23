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

    async approveService(applicationId: string, notes?: string): Promise<any> {
        const payload: any = { application_id: applicationId };
        if (notes) {
            payload.notes = notes;
        }
        return http.post('/merchant-application/approve', payload);
    }

    async rejectService(applicationId: string, notes?: string): Promise<any> {
        const payload: any = { application_id: applicationId };
        if (notes) {
            payload.notes = notes;
        }
        return http.post('/merchant-application/reject', payload);
    }

    async suspendMerchant(applicationId: string, notes?: string): Promise<any> {
        const payload: any = { application_id: applicationId };
        if (notes) {
            payload.notes = notes;
        }
        return http.post('/merchant-application/suspend', payload);
    }

    async saveAgreement(applicationId: string, feePercent: number): Promise<any> {
        const payload: any = { application_id: applicationId, fee_percent: feePercent };
        return http.post('/merchant-application/save-agreement', payload);
    }

    async saveNotes(applicationId: string, notes: string): Promise<any> {
        const payload: any = { application_id: applicationId, notes: notes };
        return http.post('/merchant-application/save-notes', payload);
    }
}