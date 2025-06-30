import axios from "axios";

export interface PopularService {
  id: number;
  name: string;
  description: string;
  attachment: string;
  service_category_name: string;
  business_name: string;
  avg_rating: number;
  total_reviews: number;
  total_bookings: number;
}

export class HomeService {
  async listPopularServices(): Promise<{ data: PopularService[] }> {
    const response = await axios.post(import.meta.env.VITE_API_URL + "/top-pet-services/list-by-popularity");
    return response.data;
  }
}