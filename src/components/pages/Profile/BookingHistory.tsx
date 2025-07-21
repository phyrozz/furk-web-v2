import { useRef, useCallback } from "react";
import { UserProfileService } from "../../../services/profile/user-profile-service";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import PawLoading from "../../common/PawLoading";
import { useNavigate } from "react-router-dom";

interface Booking {
  booking_id: string;
  booking_datetime: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  payment_status: string;
  payment_method_id: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  remarks: string | null;
  created_at: string;
  username: string;
  service_id: number;
  service_name: string;
  service_description: string;
  service_category_name: string;
  service_category_description: string;
  payment_method_name: string;
  attachment: string | null;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const statusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Pending
        </span>
      );
    case "confirmed":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Confirmed
        </span>
      );
    case "in_progress":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
          In Progress
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          Completed
        </span>
      );
    case "cancelled":
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      );
  }
};

const BookingHistory = () => {
  const service = new UserProfileService();
  const navigate = useNavigate();

  const fetchBookings = async (limit: number, offset: number) => {
    const res: any = await service.listBookingHistory(limit, offset);
    // If the API returns { data: Booking[] }, adjust accordingly
    return res.data || [];
  };

  const {
    items: bookings,
    loadMore,
    loading,
    hasMore,
  } = useLazyLoad<Booking>({
    fetchData: fetchBookings,
    limit: 10,
    dependencies: [],
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastBookingRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  if (!bookings.length && loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <PawLoading />
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <div className="text-center text-gray-400 py-12 text-lg">
        <svg className="mx-auto mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
        No booking history found.
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-full pb-20 px-6 py-2">
      {bookings.map((booking, idx) => {
        const isLast = idx === bookings.length - 1;
        const isCancelled = booking.status === "cancelled";
        const isCompleted = booking.status === "completed";
        return (
          <div
            key={booking.booking_id}
            ref={isLast ? lastBookingRef : undefined}
            className={`transition-shadow bg-white rounded-xl shadow-sm hover:shadow-md border p-5 flex flex-col md:flex-row gap-4 cursor-pointer ${
              isCancelled
                ? "bg-red-50 border-red-100"
                : isCompleted
                ? "bg-green-50 border-green-100"
                : ""
            }`}
            onClick={() => {
              navigate(`/services/${booking.service_id}`);
            }}
          >
            <div className="flex-shrink-0">
              <img 
                src={booking.attachment!} 
                alt={booking.service_name}
                className="w-32 h-32 object-cover rounded-lg shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-service-image.jpg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-gray-800 text-lg truncate">{booking.service_name}</div>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">{booking.service_category_name}</span>
                  {statusBadge(booking.status)}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Booked:</span> {formatDate(booking.booking_datetime)}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Schedule:</span>{" "}
                  {booking.start_datetime && booking.end_datetime ? (
                    <>
                      {formatDate(booking.start_datetime)} - {formatDate(booking.end_datetime)}
                    </>
                  ) : (
                    <span className="italic text-gray-400">Not yet scheduled by merchant</span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <span className="font-medium">Payment:</span> {booking.payment_method_name}{" "}
                  <span className="ml-1 px-2 py-0.5 rounded bg-gray-100 text-xs">{booking.payment_status}</span>
                </div>
              </div>
              <div>
                {booking.cancelled_at && (
                  <div className="text-xs text-red-500 flex items-center gap-1 mt-2" title={`Cancelled by ${booking.cancelled_by || "unknown"}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Cancelled at {formatDate(booking.cancelled_at)}
                    {booking.cancelled_by && (
                      <span className="ml-1 text-gray-400">(by {booking.cancelled_by})</span>
                    )}
                  </div>
                )}
                {booking.remarks && (
                  <div className="text-xs text-gray-400 mt-2 truncate" title={booking.remarks}>
                    <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2m2-4h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                    Remarks: {booking.remarks}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {loading && (
        <div className="flex justify-center items-center py-4">
          <PawLoading />
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
