class DateUtils {
    static formatTimestampString(timestamp: string): string {
        const date = new Date(timestamp);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        };

        return date.toLocaleString(undefined, options);
    }

    static formatTimeStringFromTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        const options: Intl.DateTimeFormatOptions = {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            hour12: true
        };

        return date.toLocaleString(undefined, options);
    }

    static formatDateStringFromTimestamp(timestamp: string): string {
        const date = new Date(timestamp);
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        return date.toLocaleString(undefined, options);
    }

    static formatRelativeTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMilliseconds = now.getTime() - date.getTime();
        const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInMonths = Math.floor(diffInDays / 30);

        if (diffInMonths >= 1) {
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            };
            return date.toLocaleString(undefined, options);
        } else if (diffInDays > 0) {
            return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
        } else if (diffInHours > 0) {
            return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
        } else if (diffInMinutes > 0) {
            return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
        } else {
            return `${diffInSeconds} ${diffInSeconds === 1 ? 'second' : 'seconds'} ago`;
        }
    }

    static formatDuration(minutes: number): string {
        if (isNaN(minutes) || minutes < 0) return "N/A";

        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;

        let result = [];

        if (hrs > 0) result.push(`${hrs} hr${hrs > 1 ? "s" : ""}`);
        if (mins > 0) result.push(`${mins} min${mins > 1 ? "s" : ""}`);

        return result.join(" ");
    }
}

export default DateUtils;