import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, DollarSign, Package, Users, Plus, List, Bell } from 'lucide-react';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';
import MerchantNavbar from '../../common/MerchantNavbar';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface Activity {
  id: string;
  type: 'booking' | 'cancellation' | 'completion';
  message: string;
  timestamp: string;
}

const MerchantDashboard = () => {
  const [merchantStatus, setMerchantStatus] = useState<'verified' | 'unverified' | 'pending' | 'rejected' | 'suspended'>('pending');
  const navigate = useNavigate();
  
  const cards: DashboardCard[] = [
    {
      title: 'Total Bookings',
      value: 156,
      icon: <Package size={24} />,
      color: 'bg-primary-500',
    },
    {
      title: 'Pending Bookings',
      value: 8,
      icon: <Clock size={24} />,
      color: 'bg-warning-500',
    },
    {
      title: 'Confirmed Bookings',
      value: 12,
      icon: <Calendar size={24} />,
      color: 'bg-success-500',
    },
    {
      title: 'Total Earnings',
      value: '₱45,680',
      icon: <DollarSign size={24} />,
      color: 'bg-secondary-500',
    },
  ];

  const recentActivity: Activity[] = [
    {
      id: '1',
      type: 'booking',
      message: 'New booking request for Dog Grooming Service',
      timestamp: '10 minutes ago',
    },
    {
      id: '2',
      type: 'completion',
      message: 'Pet boarding service completed for Client #1234',
      timestamp: '1 hour ago',
    },
    {
      id: '3',
      type: 'cancellation',
      message: 'Booking #5678 was cancelled by the client',
      timestamp: '2 hours ago',
    },
  ];

  const quickActions = [
    {
      title: 'List New Service',
      icon: <Plus size={20} />,
      onClick: () => navigate('/merchant/add-service'),
    },
    {
      title: 'Manage Services',
      icon: <List size={20} />,
      onClick: () => navigate('/merchant/manage-services'),
    },
    {
      title: 'View Bookings',
      icon: <Calendar size={20} />,
      onClick: () => navigate('/merchant/bookings'),
    },
  ];

  useEffect(() => {
    const status = localStorage.getItem('merchantStatus')!;
    setMerchantStatus(status as 'verified' | 'unverified' | 'pending' | 'rejected' | 'suspended');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 cursor-default">
      <MerchantNavbar />
      <div className="container mx-auto px-4 py-8">
        {merchantStatus === 'unverified' && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between md:flex-row flex-col gap-4">
              <div>
                <h2 className="text-lg font-medium text-warning-800">
                  Verification Required
                </h2>
                <p className="text-warning-600 mt-1">
                  Please complete the verification process to start listing services and unlock all merchant features.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => navigate('/merchant/verify')}
              >
                Complete Verification
              </Button>
            </div>
          </div>
        )}

        {merchantStatus === 'pending' && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-warning-800">
                  Verification Pending
                </h2>
                <p className="text-warning-600 mt-1">
                  Your account is currently pending verification. It may take 2 to 3 business working days.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {merchantStatus !== 'unverified' && 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                onClick={action.onClick}
                icon={action.icon}
                fullWidth
              >
                {action.title}
              </Button>
            ))}
          </div>
        }

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${card.color} text-white p-3 rounded-lg`}>
                    {card.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-cursive font-semibold text-gray-800">Recent Activity</h2>
                <Bell size={20} className="text-gray-500" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-grow">
                      <p className="text-gray-800">{activity.message}</p>
                      <p className="text-sm text-gray-500 mt-1">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-cursive font-semibold text-gray-800">Today's Schedule</h2>
              <Users size={20} className="text-gray-500" />
            </div>
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No appointments scheduled for today</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => console.log('View calendar')}
              >
                View Calendar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;