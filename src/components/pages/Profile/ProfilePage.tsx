import { useState, useEffect, useCallback } from 'react';
import { User, Settings, History, Heart, LogOut, Save, PawPrint, Wallet, PlusCircle } from 'lucide-react';
import Button from '../../common/Button';
import { UserProfileService } from '../../../services/profile/user-profile-service';
import Navbar from '../../common/Navbar';
import DateUtils from '../../../utils/date-utils';
import { loginService } from '../../../services/auth/auth-service';
import { useNavigate } from 'react-router-dom';
import { ToastService } from '../../../services/toast/toast-service';
import PawLoading from '../../common/PawLoading';
import BookingHistory from './BookingHistory';
import useScreenSize from '../../../hooks/useScreenSize';
import Favorites from './Favorites';
import PetProfiles from './PetProfiles';
import TransactionHistory from './TransactionHistory';
import { UserWallet } from '../../../models/user-wallet';
import { http } from '../../../utils/http';
import TopUpSidebar from './TopUpSidebar';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
}

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isTopUpSidebarOpen, setIsTopUpSidebarOpen] = useState(false);

  const dataService = new UserProfileService();
  const navigate  = useNavigate();

  const { isMobile } = useScreenSize();

  const fetchUserWallet = useCallback(async () => {
    setLoading(true);
    try {
      const response = await http.get<{ data: UserWallet }>('/pet-owner-profile/get-user-wallet');
      setUserWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch user wallet:', error);
      setUserWallet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Profile - FURK';
    getUserDetails();
    fetchUserWallet();  

    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  const getUserDetails = async () => {
    try {
      setLoading(true);
      const response: any = await dataService.getUserDetails();
      setProfile(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setSignOutLoading(true);
      await loginService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setSignOutLoading(false);
    }
  };

  const handleUserDetailsSave = async (e: any) => {
    try {
      e.preventDefault();
      setLoadingSave(true);

      await dataService.updateUserDetails(editFormData!);
      setIsEdit(false);
      setLoadingSave(false);
      getUserDetails();
      ToastService.show('User details updated successfully');
    } catch (error: any) {
      console.error('Error fetching user details:', error);
      setLoadingSave(false);
      if (error?.response?.data?.error) {
        ToastService.show(error?.response?.data?.error);
      } else {
        ToastService.show('Error updating user details');
      }
    }
  }

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center overflow-hidden">
        <PawLoading />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'pets', label: 'My Pets', icon: PawPrint },
    // { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'history', label: 'Booking History', icon: History },
    { id: 'transactions', label: 'Transaction History', icon: Wallet },
    { id: 'favorites', label: 'Favorites', icon: Heart }
  ];

  const editForm = (
    <>
      <form onSubmit={handleUserDetailsSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-2">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.first_name ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, first_name: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              id="middleName"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.middle_name ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, middle_name: e.target.value }))}
            />
          </div>

          <div className="mb-2">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.last_name ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, last_name: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.email ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, email: e.target.value }))}
              disabled
            />
          </div>

          <div className="mb-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.phone_number ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, phone_number: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="w-full flex flex-row justify-end items-center">
          <Button
            type='submit'
            variant="primary"
            className="ml-2"
            icon={<Save size={18} />}
            loading={loadingSave}
          >
            Save
          </Button>
        </div>
      </form>
    </>
  );

  return (
    <>
      <TopUpSidebar isOpen={isTopUpSidebarOpen} onClose={
        () => {
          setIsTopUpSidebarOpen(false);
        }
      } onSuccess={
        () => {
          setIsTopUpSidebarOpen(false);
          fetchUserWallet();
        }
      } />

      <div className="pt-16 min-h-screen bg-gray-50 h-screen overflow-y-hidden select-none z-10">
        <Navbar />
        <div className="flex flex-col container mx-auto px-4 py-8 h-full box-border">
          {/* Profile Header */}
          {(!isMobile || activeTab == 'profile' ) && <div className="bg-white rounded-xl shadow-sm mb-8">
            <div className="flex sm:flex-row flex-col sm:items-center items-start gap-2 w-full overflow-x-auto p-6">
              {/* <img
                src={profile?.avatar}
                alt={profile?.username}
                className="w-24 h-24 rounded-full border-4 border-primary-100"
              /> */}
              <div className="ml-6">
                <h1 className="text-2xl font-cursive font-bold text-gray-800">{profile?.first_name} {profile?.middle_name ?? ''} {profile?.last_name}</h1>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>Member since {profile?.created_at && DateUtils.formatDateStringFromTimestamp(profile.created_at)}</span>
                  {/* <span className="mx-2">•</span>
                  <span>{profile?.location}</span> */}
                </div>
                <div className="flex flex-row gap-5 items-center mt-3">
                  <div className="">
                    <span className="text-primary-600 font-bold text-2xl">{userWallet?.furkredits.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm"> Furkredits</span>
                  </div>
                  <div className="">
                    <span className="text-primary-600 font-bold text-2xl">{userWallet?.furkoins}</span>
                    <span className="text-gray-500 text-sm"> Furkoins</span>
                  </div>
                  <Button variant="ghost" icon={<PlusCircle />} onClick={() => setIsTopUpSidebarOpen(true)}>Top up</Button>
                </div>
              </div>
              <Button
                variant="outline"
                className="ml-auto"
                icon={<LogOut size={18} />}
                onClick={handleLogout}
                loading={signOutLoading}
              >
                Sign Out
              </Button>
            </div>
          </div>}

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-8 w-full overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-500'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-white rounded-xl shadow-sm h-full overflow-y-hidden">
            {activeTab === 'profile' && (
              <div className="space-y-6 h-full overflow-y-hidden">
                <div className="flex flex-row justify-between items-center px-6 pt-6">
                  <h2 className="text-xl font-cursive font-semibold text-gray-800">Personal Information</h2>
                  <button
                    onClick={() => {
                      if (!isEdit && profile) {
                        setEditFormData({ ...profile });
                      }
                      setIsEdit(!isEdit);
                    }}                  
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {isEdit ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                <div className="h-[calc(100%-4rem)] overflow-y-auto p-6">
                  {isEdit? editForm : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={[profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ')}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={profile?.email ?? ''}
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <input
                          type="tel"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={profile?.phone_number ?? ''}
                          readOnly
                        />
                      </div>
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700">Location</label>
                        <input
                          type="text"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                          value={profile?.location}
                          readOnly
                        />
                      </div> */}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6 p-6">
                <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications about your services</p>
                    </div>
                    {/* <button
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        profile?.preferences.notifications ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile?.preferences.notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button> */}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Newsletter</h3>
                      <p className="text-sm text-gray-500">Receive updates about new services</p>
                    </div>
                    {/* <button
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        profile?.preferences.newsletter ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                      role="switch"
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          profile?.preferences.newsletter ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button> */}
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      value={profile?.preferences.language}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div> */}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="overflow-y-hidden h-full">
                <h2 className="text-xl font-cursive font-semibold text-gray-800 py-6 px-6">Booking History</h2>
                <BookingHistory />
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="overflow-y-hidden h-full">
                <h2 className="text-xl font-cursive font-semibold text-gray-800 py-6 px-6">Favorites</h2>
                <Favorites />
              </div>
            )}

            {activeTab === 'pets' && (
              <div className="overflow-y-hidden h-full">
                <PetProfiles />
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="overflow-y-hidden h-full">
                <h2 className="text-xl font-cursive font-semibold text-gray-800 py-6 px-6">Transaction History</h2>
                <TransactionHistory />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;