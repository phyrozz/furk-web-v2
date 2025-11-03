import { useState, useImperativeHandle, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, User } from 'lucide-react';
import { useLazyLoad } from '../../../../hooks/useLazyLoad';
import { http } from '../../../../utils/http';
import PawLoading from '../../../common/PawLoading';
import Button from '../../../common/Button';
import DateUtils from '../../../../utils/date-utils';

interface PetOwner {
  id: string;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  created_at: string;
  role_id: string;
  is_active: boolean;
}

export interface PetOwnersWidgetRef {
  refetch: () => void;
}

const PetOwnersWidget = forwardRef<PetOwnersWidgetRef>((props, ref) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchPetOwners = async (limit: number, offset: number, keyword: string) => {
    try {
      const response: any = await http.post('/admin-dashboard/list-users', {
        limit,
        offset,
        keyword,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching pet owners:', error);
      return [];
    }
  };

  const { items: petOwners, loadMore, loading, hasMore, reset } = useLazyLoad<PetOwner>({
    fetchData: fetchPetOwners,
    limit: 10,
    keyword: searchKeyword,
  });

  useImperativeHandle(ref, () => ({
    refetch: () => reset(),
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFullName = (owner: PetOwner) => {
    return `${owner.first_name} ${owner.middle_name ? owner.middle_name + ' ' : ''}${owner.last_name}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Pet Owners</h3>
      </div>

      {loading && petOwners.length === 0 ? (
        <div className="flex justify-center py-8">
          <PawLoading />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {petOwners.map((owner, index) => (
                  <motion.tr 
                    key={owner.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{getFullName(owner)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {owner.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {DateUtils.formatTimestampString(owner.created_at)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="ghost"
                onClick={loadMore}
                disabled={loading}
                loading={loading}
                icon={<ChevronDown />}
              >
                Load More
              </Button>
            </div>
          )}

          {!hasMore && petOwners.length > 0 && (
            <p className="text-center text-sm text-gray-500 mt-4">
              All pet owners loaded
            </p>
          )}

          {!loading && petOwners.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No pet owners found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
});

PetOwnersWidget.displayName = 'PetOwnersWidget';

export default PetOwnersWidget;