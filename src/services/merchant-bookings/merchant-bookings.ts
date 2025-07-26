import { http } from "../../utils/http";

export class MerchantBookingsService {
  async listBookings(
    status: string = 'All',
    startDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    keyword: string = ''
  ): Promise<any> {
    const data = {
      status: status === 'All' ? null : status,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      keyword: keyword,
    }

    return http.post('/merchant/booking/list', data);
  }

  async getBookingDetails(id: number): Promise<any> {
    return http.get(`/merchant/booking/get/${id}`);
  }

  async confirmBooking(id: number): Promise<any> {
    return http.post(`/merchant/booking/confirm/${id}`);
  }

  async cancelBooking(id: number): Promise<any> {
    return http.post(`/merchant/booking/cancel/${id}`, {});
  }

  async startService(id: number): Promise<any> {
    return http.post(`/merchant/booking/start/${id}`, {});
  }

  async completeService(id: number): Promise<any> {
    return http.post(`/merchant/booking/complete/${id}`, {});
  }
}