import { http } from "../../utils/http";
import moment from "moment";

export interface AdminPayout {
  id: number;
  booking_id: number;
  merchant_id: number;
  amount: number;
  earning_date: string;
  status: 'pending' | 'approved' | 'processed' | 'failed';
  maya_payout_id?: string;
  processed_at?: string;
  created_at: string;
  created_by: string;
  modified_at: string;
  modified_by: string;
  service: {
    id: number;
    name: string;
    description: string;
    status: string;
  };
  merchant: {
    id: number;
    business_name: string;
    merchant_type: string;
  };
  merchant_user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
}

export class AdminPayoutService {
  async listPayouts(
    limit: number,
    offset: number,
    keyword: string,
    startDate: Date,
    endDate: Date,
    status?: string
  ): Promise<any> {
    const payload: any = {
      limit,
      offset,
      keyword,
      start_date: moment(startDate).format('YYYY-MM-DD'),
      end_date: moment(endDate).format('YYYY-MM-DD'),
    };
    
    if (status) {
      payload.status = status;
    }
    
    return http.post('/merchant-payouts/admin/list', payload);
  }

  async approvePayout(payoutId: number): Promise<any> {
    return http.post('/merchant-payouts/admin/approve', {
      payout_id: payoutId,
    });
  }

  async processPayout(payoutId: number): Promise<any> {
    return http.post('/merchant-payouts/admin/process', {
      payout_id: payoutId,
    });
  }
}
