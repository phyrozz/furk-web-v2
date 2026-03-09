import { http } from '../../utils/http';

export interface ListMerchantsParams {
  limit: number;
  offset: number;
  keyword: string;
  longitude: number;
  latitude: number;
  sortBy?: 'booking_count' | 'average_rating' | 'distance_meters';
  sortOrder?: 'ASC' | 'DESC';
  maxDistanceMeters?: number | null;
}

export class MerchantsService {
  async listMerchants({
    limit,
    offset,
    keyword,
    longitude,
    latitude,
    sortBy = 'booking_count',
    sortOrder = 'DESC',
    maxDistanceMeters = null
  }: ListMerchantsParams): Promise<any> {
    return http.publicPost('/pet-services/list-merchants', {
      limit,
      offset,
      keyword,
      long: longitude,
      lat: latitude,
      sort_by: sortBy,
      sort_order: sortOrder,
      max_distance_meters: maxDistanceMeters
    });
  }
}
