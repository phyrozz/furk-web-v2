import axios from "axios";

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
    ) {
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

        const response = await axios.post(import.meta.env.VITE_API_URL + "/pet-services/list", data);
        return response.data;
    }

    async getServiceDetails(id: number) {
        const response = await axios.get(import.meta.env.VITE_API_URL + `/pet-services/get/${id}`);
        return response.data;
    }

    async listReviews(
        limit: number,
        offset: number,
        serviceId: number,
        sortOrder: "ASC" | "DESC" = "DESC"
    ) {
        const data = {
            limit: limit,
            offset: offset,
            service_id: serviceId,
            sort_order: sortOrder
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/pet-services/list-ratings", data);
        return response.data;
    }

    async createBooking(data: {
        service_id: number;
        booking_datetime: string;
        payment_method_id: number;
    }) {
        const response = await axios.post(import.meta.env.VITE_API_URL + "/booking", data, {
            headers: {
                Authorization: localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}