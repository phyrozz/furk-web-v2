import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { PetServicesService } from "../../../services/pet-services/pet-services";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import { Rating } from 'react-simple-star-rating';
import PawLoading from "../../common/PawLoading";
import DateUtils from "../../../utils/date-utils";

interface Review {
  id: number;
  rating: number;
  review: string;
  review_title: string;
  created_at: string;
  modified_at: string;
  username: string;
}

interface ReviewsListProps {
  serviceId: number;
}

export interface ReviewsListRef {
  reset: () => void;
}

const ReviewsList = forwardRef<ReviewsListRef, ReviewsListProps>(({ serviceId }, ref) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<boolean>(false);
  const petServicesService = new PetServicesService();

  const fetchReviews = useCallback(
    async (limit: number, offset: number) => {
      try {
        const response = await petServicesService.listReviews(
          limit,
          offset,
          serviceId,
          'DESC'
        );
        
        if (!response || !response.data) {
          setError(true);
          return [];
        }
        
        return response.data;
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(true);
        return [];
      }
    },
    [petServicesService]
  );

  const { items: reviews, loadMore, loading, hasMore, reset } = useLazyLoad<Review>({
    fetchData: fetchReviews,
    limit: 10,
    keyword: ''
  });

  // Expose `reset` to parent
  useImperativeHandle(ref, () => ({
    reset
  }));

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !error) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, error]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error-600">Failed to load reviews</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Customer Reviews</h2>
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <div 
            key={review.id} 
            className="bg-white rounded-lg shadow-sm p-6 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{review.username}</p>
                <Rating
                  initialValue={review.rating / 2}
                  size={24}
                  allowFraction
                  SVGstyle={{ "display": "inline" }}
                  readonly
                />
              </div>
              <time className="text-sm text-gray-500 whitespace-nowrap">
                {DateUtils.formatRelativeTime(review.created_at)}
              </time>
            </div>
            
            {review.review_title && (
              <h3 className="mt-3 text-lg font-medium text-gray-900">{review.review_title}</h3>
            )}
            
            <p className="mt-4 text-gray-600">{review.review}</p>
            
            {review.modified_at !== review.created_at && (
              <p className="mt-2 text-xs text-gray-400 italic">
                Edited on {new Date(review.modified_at).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <PawLoading />
          </div>
        )}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        )}

        <div ref={observerTarget} className="h-4" />
      </div>
    </div>
  );
});

export default ReviewsList;