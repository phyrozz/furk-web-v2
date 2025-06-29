import axios from "axios";

export class MerchantDashboardService {
  async listAppointmentsToday() {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant-dashboard/list-scheduled-appointments`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async getDashboardStats() {
    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant-dashboard/stats`, {}, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }

  async getRecentActivities(limit: number, offset: number) {
    const data = {
      limit: limit,
      offset: offset
    }

    const response = await axios.post(import.meta.env.VITE_API_URL + `/merchant-notifications/list`, data, {
      headers: {
        "Authorization": localStorage.getItem("cognitoIdToken")
      }
    });
    return response.data;
  }
}