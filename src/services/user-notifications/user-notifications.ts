import { http } from '../../utils/http';

export class UserNotificationsService {
    async listUserNotifications(limit: number, offset: number) {
        const data = {
            limit: limit,
            offset: offset
        }

        return http.post('/user-notifications/list', data);
    }

    async listInProgressServices(limit: number, offset: number) {
        const data = {
            limit: limit,
            offset: offset
        }

        return http.post('/user-notifications/in-progress-services', data);
    }
}

export const userNotificationsService = new UserNotificationsService();