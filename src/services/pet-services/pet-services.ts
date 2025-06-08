import axios from "axios";

export class PetServicesService {
    async listServices(
        limit: number, 
        offset: number, 
        keyword: string, 
        longitude: number, 
        latitude: number, 
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
            sort_order: sortOrder
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
        start_time: string;
        end_time: string;
        payment_method_id: number;
    }) {
        // convert start_time and end_time to full timestamps using booking_datetime date
        const bookingDate = data.booking_datetime.split('T')[0];
        const requestData = {
            ...data,
            start_time: `${bookingDate}T${data.start_time}:00Z`,
            end_time: `${bookingDate}T${data.end_time}:00Z`
        };

        const response = await axios.post(import.meta.env.VITE_API_URL + "/booking", requestData, {
            headers: {
                Authorization: localStorage.getItem("cognitoIdToken")
            }
        });
        return response.data;
    }
}