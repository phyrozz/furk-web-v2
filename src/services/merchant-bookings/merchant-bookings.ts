import axios from "axios";

export class MerchantBookingsService {
  async listBookings(
    status: string = 'All',
    startDate: Date = new Date(new Date().setDate(1)),
    endDate: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    keyword: string = ''
  ) {
    const data = {
      status: status === 'All' ? null : status,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      keyword: keyword,
    }

    const response = await axios.post(import.meta.env.VITE_API_URL + "/merchant/booking/list", data, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async getBookingDetails(id: number) {
    const response = await axios.get(import.meta.env.VITE_API_URL + `/merchant/booking/get/${id}`, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async confirmBooking(id: number) {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant/booking/confirm/${id}`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async cancelBooking(id: number) {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant/booking/cancel/${id}`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async startService(id: number) {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant/booking/start/${id}`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async completeService(id: number) {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant/booking/complete/${id}`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }
}