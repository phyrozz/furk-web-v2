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
}