import axios from "axios";
import { ReviewForm } from "../../components/pages/Services/ReviewDialog";
import { http } from "../../utils/http";

export class PetServicesService {
    async listServices(
        limit: number, 
        offset: number, 
        keyword: string, 
        longitude: number, 
        latitude: number, 
        serviceGroupId: number = 0,
        sortBy: string = "distance_meters",
        sortOrder: string = "DESC"
    ): Promise<any> {
        const data = {
            limit: limit,
            offset: offset,
            keyword: keyword,
            long: longitude,
            lat: latitude,
            sort_by: sortBy,
            sort_order: sortOrder,
            service_group_id: serviceGroupId
        }

        return http.publicPost('/pet-services/list', data);
    }

    async getServiceDetails(id: number): Promise<any> {
        const cognitoIdToken = localStorage.getItem("cognitoIdToken");
        const config: any = {};
        if (cognitoIdToken) {
            config.headers = {
                "Authorization": cognitoIdToken
            };
        }

        return http.get(`/pet-services/get/${id}`, config);
    }

    async listReviews(
        limit: number,
        offset: number,
        serviceId: number,
        sortOrder: "ASC" | "DESC" = "DESC"
    ): Promise<any> {
        const data = {
            limit: limit,
            offset: offset,
            service_id: serviceId,
            sort_order: sortOrder
        }

        return http.post('/pet-services/list-ratings', data);
    }

    async createBooking(data: {
        service_id: number;
        booking_datetime: string;
        pet_ids: number[];
    }): Promise<any> {
        return http.post('/booking', data);
    }

    async addToFavorites(serviceId: number): Promise<any> {
        return http.post('/favorite/add', {
            service_id: serviceId
        });
    }

    async removeToFavorites(serviceId: number): Promise<any> {
        return http.delete(`/favorite/delete/${serviceId}`);
    }

    async listPets(limit: number, offset: number): Promise<any> {
        return http.post('/pets/list', {
            limit: limit,
            offset: offset
        });
    }

    async submitReview(data: ReviewForm): Promise<any> {
        return http.post('/review', data);
    }

    async listRecommendations(limit: number, offset: number, serviceId: number): Promise<any> {
        return http.post('/pet-services/list-recommendations', {
            limit: limit,
            offset: offset,
            service_id: serviceId
        });
    }
}