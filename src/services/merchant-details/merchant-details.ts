import { http } from "../../utils/http";

export class MerchantDetailsService {
  async getMerchantDetails(id: string): Promise<any> {
    return http.publicGet(`/merchant-details/${id}`);
  }

  async listServicesByMerchant(offset: number, limit: number, merchantId: string, keyword: string): Promise<any> {
    const data = {
      offset: offset,
      limit: limit,
      keyword: keyword,
    }

    return http.publicPost(`/merchant-details/${merchantId}/services`, data);
  }

  async startConversation(merchantId: string): Promise<any> {
    return http.post('/merchant-chat/start-conversation', {
      merchant_id: Number(merchantId)
    });
  }

  async getConversation(conversationId: string): Promise<any> {
    return http.get(`/merchant-chat/get-conversation/${conversationId}`);
  }
}
