import { Bell } from 'lucide-react';
import PawLoading from '../../../common/PawLoading';
import DateUtils from '../../../../utils/date-utils';

interface Activity {
  id: number;
  merchant_id?: number;
  service_id?: number;
  title: string;
  description?: string;
  modified_at: string;
}

interface RecentActivitiesProps {
  recentActivity: Activity[];
  loading: boolean;
  hasMore: boolean;
  lastActivityElementRef: (node: HTMLDivElement) => void;
}

export const RecentActivities = ({ recentActivity, loading, hasMore, lastActivityElementRef }: RecentActivitiesProps) => {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-cursive font-semibold text-gray-800">Recent Activity</h2>
          <Bell size={20} className="text-gray-500" />
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => {
              const isLastElement = recentActivity.length === index + 1;
              return (
                <div
                  ref={isLastElement ? lastActivityElementRef : undefined}
                  key={activity.id}
                  className="flex items-start p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-grow">
                    <div className="flex flex-col items-start justify-center">
                      <p className="text-gray-800 font-medium">{activity.title}</p>
                      <span className="text-sm text-gray-500">
                        {DateUtils.formatRelativeTime(activity.modified_at)}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-gray-600 mt-1">{activity.description}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : !loading && recentActivity.length === 0 ? (
            <div className="px-4 py-3 text-gray-600">No recent activities</div>
          ) : null}
          {loading && (
            <div className="w-full h-full flex justify-center items-center">
              <PawLoading />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
