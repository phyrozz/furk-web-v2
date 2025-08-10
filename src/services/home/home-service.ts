import { http } from "../../utils/http";

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
  price: number;
}

export class HomeService {
  async listPopularServices(): Promise<{ data: PopularService[] }> {
    return http.publicPost('/top-pet-services/list-by-popularity');
  }
}