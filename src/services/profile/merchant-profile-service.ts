import { MerchantProfile } from "../../components/pages/Merchant/MerchantProfilePage";
import { BreakHour } from "../../components/pages/Merchant/SetBreakHours/SetBreakHoursPage";
import { BusinessHour } from '../../components/pages/Merchant/SetBusinessHours/SetBusinessHoursPage';
import { http } from '../../utils/http';

export class MerchantProfileService {
  async getMerchantDetails(): Promise<any> {
        return http.get('/merchant-profile');
    }

    async updateMerchantDetails(merchantProfile: MerchantProfile): Promise<any> {
        return http.put('/merchant-profile', merchantProfile);
    }

    async updateMerchantBusinessHours(businessHours: BusinessHour[]): Promise<any> {
        return http.post('/merchant-profile/business-hours', { data: businessHours });
    }

    async updateMerchantBreakHours(breakHours: BreakHour[]): Promise<any> {
        return http.post('/merchant-profile/break-hours', { data: breakHours });
    }
}