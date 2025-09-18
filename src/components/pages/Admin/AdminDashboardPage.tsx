import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Dog, User, Users } from 'lucide-react';
import PawLoading from '../../common/PawLoading';
import { http } from '../../../utils/http';
import AdminNavbar from '../../common/AdminNavbar';
import TrendChart from './Dashboard/TrendChart';
import Select from '../../common/Select';

interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface AdminStats {
  users_count: number;
  merchants_count: number;
  affiliates_count: number;
}

interface TrendData {
  date: string;
  count: number;
}

interface DateFilter {
  start_date: string;
  end_date: string;
}

interface ViewTypeOption {
  label: string;
  value: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const getDateRange = (viewType: 'weekly' | 'monthly' | 'biannual') => {
  const now = new Date();
  const endDate = new Date(now.setDate(now.getDate() + 1)); // today + 1 day
  const startDate = new Date();

  switch (viewType) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'biannual':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
  }

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  };
};

const viewTypeOptions = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Bi-Annual', value: 'biannual' }
];

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminStats>({
    users_count: 0,
    merchants_count: 0,
    affiliates_count: 0
  });
  const [trendData, setTrendData] = useState({
    petOwner: [] as TrendData[],
    merchant: [] as TrendData[],
    affiliate: [] as TrendData[]
  });
  
  const [trendFilters, setTrendFilters] = useState({
    petOwner: { ...getDateRange('weekly'), viewType: 'weekly' as const },
    merchant: { ...getDateRange('monthly'), viewType: 'monthly' as const },
    affiliate: { ...getDateRange('monthly'), viewType: 'monthly' as const }
  });
  
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    try {
      const response: any = await http.post('/admin-dashboard/stats');
      setStats(response.data || {});
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTrendData = async (type: 'petOwner' | 'merchant' | 'affiliate') => {
    const endpoints = {
      petOwner: '/admin-dashboard/user-trend',
      merchant: '/admin-dashboard/merchant-trend',
      affiliate: '/admin-dashboard/affiliate-trend'
    };

    try {
      const filter: DateFilter = {
        start_date: trendFilters[type].start_date,
        end_date: trendFilters[type].end_date
      };
      
      const response: any = await http.post(endpoints[type], filter);
      setTrendData(prev => ({
        ...prev,
        [type]: response.data || []
      }));
    } catch (err) {
      console.error(`Error fetching ${type} trend:`, err);
    }
  };

  const handleViewTypeChange = (
    type: 'petOwner' | 'merchant' | 'affiliate',
    option: ViewTypeOption | null
  ) => {
    if (!option) return;

    const newDateRange = getDateRange(option.value as 'weekly' | 'monthly' | 'biannual');

    setTrendFilters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        ...newDateRange,
        viewType: option.value
      }
    }));
  };

  useEffect(() => {
    fetchStats();
    fetchTrendData('petOwner');
    fetchTrendData('merchant');
    fetchTrendData('affiliate');
  }, [trendFilters]);

  const cards: DashboardCard[] = [
    {
      title: 'Total Pet Owners',
      value: stats.users_count,
      icon: <Dog size={24} />,
      color: 'bg-primary-500',
    },
    {
      title: 'Total Merchants',
      value: stats.merchants_count,
      icon: <User size={24} />,
      color: 'bg-warning-500',
    },
    {
      title: 'Total Affiliates',
      value: stats.affiliates_count,
      icon: <Users size={24} />,
      color: 'bg-success-500',
    },
  ];

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <AdminNavbar />

      {statsLoading && 
        <div className="w-full h-full overflow-hidden flex flex-1 items-center justify-center">
          <PawLoading />
        </div>
      }

      {!statsLoading && <div className="container mx-auto px-4 py-8 pt-24 cursor-default">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Trend Charts */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Pet Owners</h3>
              <Select
                options={viewTypeOptions}
                value={viewTypeOptions.find(opt => opt.value === trendFilters.petOwner.viewType) || null}
                onChange={(option) => handleViewTypeChange('petOwner', option as ViewTypeOption)}
                getOptionLabel={(option) => option.label}
                className="w-40"
              />
            </div>
            <TrendChart
              data={trendData.petOwner}
              lineColor="#6366f1"
              viewType={trendFilters.petOwner.viewType}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Merchants</h3>
              <Select
                options={viewTypeOptions}
                value={viewTypeOptions.find(opt => opt.value === trendFilters.merchant.viewType) || null}
                onChange={(option) => handleViewTypeChange('merchant', option as ViewTypeOption)}
                getOptionLabel={(option) => option.label}
                className="w-40"
              />
            </div>
            <TrendChart
              data={trendData.merchant}
              lineColor="#f59e0b"
              viewType={trendFilters.merchant.viewType}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Affiliates</h3>
              <Select
                options={viewTypeOptions}
                value={viewTypeOptions.find(opt => opt.value === trendFilters.affiliate.viewType) || null}
                onChange={(option) => handleViewTypeChange('affiliate', option as ViewTypeOption)}
                getOptionLabel={(option) => option.label}
                className="w-40"
              />
            </div>
            <TrendChart
              data={trendData.affiliate}
              lineColor="#10b981"
              viewType={trendFilters.affiliate.viewType}
            />
          </div>
        </div>
      </div>}
    </div>
  );
};

export default AdminDashboardPage;