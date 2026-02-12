import { http } from "../../utils/http";

export class MerchantDashboardService {
  async listAppointmentsToday(): Promise<any> {
    return http.post('/merchant-dashboard/list-scheduled-appointments');
  }

  async getDashboardStats(): Promise<any> {
    return http.post('/merchant-dashboard/stats');
  }

  async getRecentActivities(limit: number, offset: number): Promise<any> {
    const data = {
      limit: limit,
      offset: offset
    }

    return http.post('/merchant-notifications/list', data);
  }

  async getMerchantLocation(): Promise<any> {
    return http.get('/merchant-profile');
  }

  async updateMerchantLocation(long: number, lat: number): Promise<any> {
    return http.post('/merchant-profile/location', {
      long,
      lat
    });
  }

  async searchLocations(query: string, limit: number = 5): Promise<any> {
    return http.post('/location-search/geocode', {
      query,
      limit
    });
  }
}
