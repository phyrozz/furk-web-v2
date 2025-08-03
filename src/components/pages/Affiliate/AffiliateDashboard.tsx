import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Copy, CheckCircle } from 'lucide-react';
import Button from '../../common/Button';
import AffiliateNavbar from '../../common/AffiliateNavbar';
import { http } from '../../../utils/http';
import PawLoading from '../../common/PawLoading';
import MerchantList from './Dashboard/MerchantList';
import BookingHistoryList from './Dashboard/BookingHistoryList';

interface AffiliateData {
  id: string;
  role_name: string;
  affiliate_code: string;
  address: string;
  application_status: 'pending' | 'verified' | 'suspended' | 'rejected';
  merchant_count: number;
  verified_merchant_count: number;
  pending_merchant_count: number;
}

const AffiliateDashboard = () => {
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
    return `${window.location.origin}/sign-up/merchant?ref=${affiliateData?.affiliate_code}`;
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
      {affiliateData?.application_status === 'pending' && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-warning-800">
                Verification Pending
              </h2>
              <p className="text-warning-600 mt-1">
                Your account is currently pending verification. It may take 2 to 3 business working days. Take note that your affiliate ID will not work on merchants until your account is verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {affiliateData?.application_status === 'rejected' && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-danger-800">
                Verification Rejected
              </h2>
              <p className="text-danger-600 mt-1">
                Your account has been rejected. Please contact support for more information.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <h3 className="text-lg font-semibold">Total Merchants</h3>
          </div>
          <p className="text-3xl font-bold text-primary-600">{affiliateData?.merchant_count}</p>
          <p className="text-sm text-gray-500 mt-2">{affiliateData?.pending_merchant_count} pending/unverified, {affiliateData?.verified_merchant_count} verified</p>
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
          <p className="text-3xl font-bold text-green-600">0 Points</p>
          <p className="text-sm text-gray-500 mt-2">Commission rate: 5%</p>
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
            onClick={() => {
              setActiveTab('referrals');
              if (activeTab === 'referrals') {
                setRefreshTrigger(prev => prev + 1);
              }
            }}
          >
            Merchants
          </button>
          <button
            className={`px-6 py-3 font-medium ${activeTab === 'bookings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-600 hover:text-primary-600'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Program Overview</h3>
              <p className="text-gray-600 mb-4">
                Welcome to the FURK Affiliate Program! As an affiliate, you earn commission for every merchant you refer who signs up and gets verified through our platform.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">How it works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Share your unique referral link with potential merchants</li>
                  <li>When they sign up using your link, they're tracked as your referral</li>
                  <li>You earn 10% commission on their first booking</li>
                  <li>Commissions are paid out monthly to your registered bank account</li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg mb-4 border border-yellow-200">
                <h4 className="font-semibold mb-2 text-yellow-700">Important Note:</h4>
                <p className="text-gray-700 mb-2">
                  Your referral link will direct merchants to our sign-up page. Make sure they complete the registration process to be counted as your referral.
                </p>
                <div className="bg-white p-3 rounded border border-gray-200 flex items-center justify-between">
                  <code className="text-sm text-gray-800">{generateReferralLink()}</code>
                  <button 
                    onClick={copyReferralLink}
                    className="ml-2 text-gray-500 hover:text-primary-600 transition-colors"
                    aria-label="Copy referral link"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
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
              <MerchantList refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <BookingHistoryList refreshTrigger={refreshTrigger} />
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