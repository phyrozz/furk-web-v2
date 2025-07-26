import { http } from "../../utils/http";
import { LocalStorageService } from "../local-storage/local-storage-service";


export interface MerchantServiceStatus {
  merchant_status: string;
}

export class CheckMerchantStatusService {
  async setMerchantStatus(): Promise<void> {
    const localStorage = new LocalStorageService();
    const response: { data: MerchantServiceStatus } = await http.get('/check-merchant-status');
    const status = response.data.merchant_status;
    localStorage.setMerchantStatus(status);
  }
}

export const checkMerchantStatusService = new CheckMerchantStatusService();
