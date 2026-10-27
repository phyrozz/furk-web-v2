import axios from "axios";
import { ReviewForm } from "../../components/pages/Services/ReviewDialog";
import { http } from "../../utils/http";
import type { BookingRequest, BookingResult } from "../../utils/booking-request";
import { accountWallet } from '../account-summary/account-summary';

interface BookingAvailabilityResponse {
    data: {
        timezone: string;
        duration_minutes: number;
        available_slots: Record<string, string[]>;
    };
}

export class PetServicesService {
    async listServiceGroups(): Promise<{ data: Array<{ id: number; name: string }> }> {
        return http.publicPost('/pet-services/list-service-groups', {});
    }

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

    async createBooking(data: BookingRequest): Promise<BookingResult> {
        const session = accountWallet.getSession();
        const response = await http.post<BookingResult>('/booking', data);
        if (session === accountWallet.getSession()) accountWallet.invalidate();
        return response;
    }

    async getBookingRequest(requestId: string): Promise<BookingResult> {
        const session = accountWallet.getSession();
        const response = await http.get<BookingResult>(`/booking/requests/${encodeURIComponent(requestId)}`);
        if (session === accountWallet.getSession()) accountWallet.invalidate();
        return response;
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

    async listClosuresAndBreaks(startDate: Date, endDate: Date, merchantId: number, serviceId: number): Promise<BookingAvailabilityResponse> {
        const calendarDate = (date: Date) => (
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        );
        return http.post('/booking/list-closures-and-break-times', {
            start_date: `${calendarDate(startDate)}T00:00:00+08:00`,
            end_date: `${calendarDate(endDate)}T23:59:59+08:00`,
            merchant_id: merchantId,
            service_id: serviceId
        });
    }
}
