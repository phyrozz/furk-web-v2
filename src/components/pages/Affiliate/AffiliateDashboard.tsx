import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, DollarSign, BarChart2, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '../../common/Button';
import AffiliateNavbar from '../../common/AffiliateNavbar';
import { http } from '../../../utils/http';
import PawLoading from '../../common/PawLoading';

interface AffiliateData {
  id: string;
  role_name: string;
  affiliate_code: string;
  address: string;
  application_status: 'pending' | 'verified' | 'suspended' | 'rejected';
}

const AffiliateDashboard = () => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    earnings: 0,
    conversionRate: 0,
    pendingReferrals: 0,
    completedReferrals: 0
  });
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAffiliateData = async () => {
      try {
        const response = await http.get<{data: AffiliateData}>('/affiliate/dashboard');
        setAffiliateData(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching affiliate data:', error);
      }
    };

    fetchAffiliateData();
  }, []);

  const copyToClipboard = () => {
    if (affiliateData?.affiliate_code) {
      navigator.clipboard.writeText(affiliateData.affiliate_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateReferralLink = () => {
    return `${window.location.origin}?ref=${affiliateData?.affiliate_code}`;
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(generateReferralLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loading = (
    <div className="flex items-center justify-center h-screen">
      <PawLoading />
    </div>
  );

  if (isLoading) {
    return loading;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 mt-20 select-none">
      <AffiliateNavbar />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-800">Affiliate Dashboard</h1>
          <p className="text-gray-600">Track your referrals and earnings</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 md:mt-0"
        >
          <Button
            variant="primary"
            size="md"
            onClick={copyReferralLink}
          >
            {copied ? <CheckCircle size={18} className="mr-2" /> : <Copy size={18} className="mr-2" />}
            {copied ? 'Copied!' : 'Copy Referral Link'}
          </Button>
        </motion.div>
      </div>

      {/* Affiliate ID Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-md p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Affiliate ID</h2>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">{affiliateData?.affiliate_code}</span>
              <button 
                onClick={copyToClipboard}
                className="ml-2 text-gray-500 hover:text-primary-600 transition-colors"
                aria-label="Copy affiliate ID"
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <p className="text-gray-600">Referral Link:</p>
            <div className="flex items-center">
              <span className="text-sm text-gray-800 font-medium truncate max-w-xs">{generateReferralLink()}</span>
              <button 
                onClick={copyReferralLink}
                className="ml-2 text-gray-500 hover:text-primary-600 transition-colors"
                aria-label="Copy referral link"
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600 mr-4">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-semibold">Total Referrals</h3>
          </div>
          <p className="text-3xl font-bold text-primary-600">{stats.totalReferrals}</p>
          <p className="text-sm text-gray-500 mt-2">{stats.pendingReferrals} pending, {stats.completedReferrals} completed</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <DollarSign size={24} />
            </div>
            <h3 className="text-lg font-semibold">Total Earnings</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">${stats.earnings.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-2">Commission rate: 10%</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b">
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'overview' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'referrals' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
            onClick={() => setActiveTab('referrals')}
          >
            Referrals
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'payouts' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
            onClick={() => setActiveTab('payouts')}
          >
            Payouts
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Program Overview</h3>
              <p className="text-gray-600 mb-4">
                Welcome to the FURK Affiliate Program! As an affiliate, you earn commission for every customer you refer who signs up and books a service through our platform.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Share your unique referral link with potential customers</li>
                  <li>When they sign up using your link, they're tracked as your referral</li>
                  <li>You earn 10% commission on their first booking</li>
                  <li>Commissions are paid out monthly to your registered bank account</li>
                </ol>
              </div>
              
              <div className="bg-primary-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-primary-700">Tips for success:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Share your link on social media platforms</li>
                  <li>Write blog posts about pet care and include your referral link</li>
                  <li>Create content showcasing the benefits of FURK's pet services</li>
                  <li>Engage with pet communities and forums</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Referrals</h3>
              {recentReferrals.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* This would be populated with actual referral data */}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">You don't have any referrals yet.</p>
                  <p className="text-gray-600">Share your referral link to start earning!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Payout History</h3>
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No payouts yet.</p>
                <p className="text-gray-600">Commissions are paid out monthly once you reach the minimum threshold of $50.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Marketing Materials */}
      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Marketing Materials</h3>
        <p className="text-gray-600 mb-4">
          Use these resources to promote FURK services and increase your referrals.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Social Media Templates</h4>
            <p className="text-gray-600 text-sm mb-3">Ready-to-use posts for Facebook, Instagram, and Twitter.</p>
            <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              Download Templates <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Banner Images</h4>
            <p className="text-gray-600 text-sm mb-3">High-quality banners for websites and blogs.</p>
            <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
              Download Banners <ExternalLink size={16} className="ml-1" />
            </a>
          </div>
        </div>
      </motion.div> */}
    </div>
  );
};

export default AffiliateDashboard;