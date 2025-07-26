import { useRef, useCallback } from "react";
import { UserProfileService } from "../../../services/profile/user-profile-service";
import { useLazyLoad } from "../../../hooks/useLazyLoad";
import PawLoading from "../../common/PawLoading";
import { useNavigate } from "react-router-dom";

interface Favorite {
  id: string;
  service: {
    id: string;
    name: string;
    description: string;
    service_category: {
      id: string;
      name: string;
      description: string;
    };
    created_at: string;
    created_by: string;
    modified_at: string;
    modified_by: string;
  };
  merchant: {
    id: string;
    business_name: string;
    merchant_type: string;
    address: string;
    city: string;
    province: string;
    barangay: string;
    created_at: string;
    created_by: string;
    modified_at: string;
    modified_by: string;
  };
  attachment: string | null;
  created_at: string;
  modified_at: string;
  created_by: string;
  modified_by: string;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const Favorites = () => {
  const service = new UserProfileService();
  const navigate = useNavigate();

  const fetchFavorites = async (limit: number, offset: number) => {
    const res: any = await service.listFavorites(limit, offset);
    return res.data || [];
  };

  const {
    items: favorites,
    loadMore,
    loading,
    hasMore,
  } = useLazyLoad<Favorite>({
    fetchData: fetchFavorites,
    limit: 10,
    dependencies: [],
  });

  const observer = useRef<IntersectionObserver | null>(null);
  const lastFavoriteRef = useCallback(
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

  if (!favorites.length && loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <PawLoading />
      </div>
    );
  }

  if (!favorites.length) {
    return (
      <div className="text-center text-gray-400 py-12 text-lg">
        <svg className="mx-auto mb-2 w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
        </svg>
        No favorites found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-full pb-20 px-6 py-2">
      {favorites.map((fav, idx) => {
        const isLast = idx === favorites.length - 1;
        return (
          <div
            key={fav.id}
            ref={isLast ? lastFavoriteRef : undefined}
            className="transition-shadow bg-white rounded-xl shadow-sm hover:shadow-md border cursor-pointer overflow-hidden flex flex-col"
            onClick={() => {
              navigate(`/services/${fav.service.id}`);
            }}
          >
            {fav.attachment && (
              <div className="h-48 relative">
                <img
                  src={fav.attachment}
                  alt={fav.service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="flex items-start gap-2 mb-2 flex-wrap">
                <div className="font-semibold text-gray-800 text-lg truncate">
                  {fav.service.name}
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 rounded px-2 py-0.5">
                  {fav.service.service_category.name}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {fav.merchant.business_name}
              </div>
            </div>
          </div>
        );
      })}
      {loading && (
        <div className="col-span-full flex justify-center items-center py-4">
          <PawLoading />
        </div>
      )}
    </div>
  );
};

export default Favorites;
