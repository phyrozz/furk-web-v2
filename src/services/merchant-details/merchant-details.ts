import axios from "axios";

export class MerchantDetailsService {
  async getMerchantDetails(id: string) {
    const response = await axios.get(import.meta.env.VITE_API_URL + `/merchant-details/${id}`);
    return response.data;
  }

  async listServicesByMerchant(offset: number, limit: number, merchantId: string, keyword: string) {
    const data = {
      offset: offset,
      limit: limit,
      keyword: keyword,
    }
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant-details/${merchantId}/services`, data);
    return response.data;
  }
}