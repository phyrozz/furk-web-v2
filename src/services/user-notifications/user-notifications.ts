import axios from 'axios';

export class UserNotificationsService {
    async listUserNotifications(limit: number, offset: number) {
        const data = {
            limit: limit,
            offset: offset
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/user-notifications/list", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }

    async listInProgressServices(limit: number, offset: number) {
        const data = {
            limit: limit,
            offset: offset
        }

        const response = await axios.post(import.meta.env.VITE_API_URL + "/user-notifications/in-progress-services", data, {
            headers: {
                'Authorization': localStorage.getItem('cognitoIdToken')
            }
        });
        return response.data;
    }
}

export const userNotificationsService = new UserNotificationsService();