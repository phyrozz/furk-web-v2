import { useState, useEffect } from 'react';
import { User, History, Heart, Save, PawPrint, CalendarX } from 'lucide-react';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';
import { useNavigate } from 'react-router-dom';
import { ToastService } from '../../../services/toast/toast-service';
import PawLoading from '../../common/PawLoading';
import useScreenSize from '../../../hooks/useScreenSize';
import MerchantNavbar from '../../common/MerchantNavbar';
import { MerchantProfileService } from '../../../services/profile/merchant-profile-service';
import SetBreakHours from './SetBreakHours/SetBreakHoursPage';

export interface MerchantProfile {
  id?: string;
  business_name?: string;
  merchant_type?: string;
  address?: string;
  city?: string;
  province?: string;
  barangay?: string;
  exterior_photo?: string;
  business_hours?: BusinessHours[];
  break_hours?: BreakHours[];
}

export interface BusinessHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

interface BreakHours {
  day_of_week: number;
  break_start: string;
  break_end: string;
  label?: string;
}

const MerchantProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<MerchantProfile | null>(null);
  const [isBusinessHoursEdit, setIsBusinessHoursEdit] = useState(false);
  const [editBusinessHoursFormData, setEditBusinessHoursFormData] = useState<BusinessHours[] | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  const dataService = new MerchantProfileService();
  const navigate  = useNavigate();

  const { isMobile } = useScreenSize();

  useEffect(() => {
    document.title = 'My Profile - FURK';
    getUserDetails();

    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  const getUserDetails = async () => {
    try {
      const response = await dataService.getMerchantDetails();
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

  const handleUserDetailsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) {
      return;
    }
    try {
      setLoadingSave(true);

       await dataService.updateMerchantDetails({
         business_name: editFormData.business_name,
         merchant_type: editFormData.merchant_type,
         address: editFormData.address,
         city: editFormData.city,
         province: editFormData.province,
         barangay: editFormData.barangay,
       });
      setIsEdit(false);
      setLoadingSave(false);
      ToastService.show("Merchant profile updated successfully!");
    } catch (error) {
      console.error("Error updating merchant profile:", error);
      ToastService.show("Failed to update merchant profile.");
    }
  };

  const handleBusinessHoursSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBusinessHoursFormData) {
      return;
    }
    try {
      setLoadingSave(true);

      await dataService.updateMerchantDetails({
        business_hours: editBusinessHoursFormData,
      });
      setIsBusinessHoursEdit(false);
      setLoadingSave(false);
      ToastService.show("Business hours updated successfully!");
    } catch (error) {
      console.error("Error updating business hours:", error);
      ToastService.show("Failed to update business hours.");
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center overflow-hidden">
        <PawLoading />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business-hours', label: 'Business Hours', icon: History },
    { id: 'break-hours', label: 'Break Hours', icon: CalendarX },
  ];

  const profileSidebar = (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden md:sticky md:top-24">
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Profile Sections</p>
          <p className="mt-2 text-lg font-cursive font-semibold text-gray-800">
            {profile?.merchant_type || 'Merchant'}
          </p>
        </div>

        <nav className="p-3 space-y-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon size={18} className={`mr-3 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* <div className="border-t border-gray-100 p-4">
          <Button
            variant="outline"
            className="w-full justify-center border-gray-200 text-gray-700 hover:bg-gray-50"
            icon={<Save size={18} className="opacity-0" />}
            onClick={() => {
              if (activeTab === 'profile') {
                setIsEdit(prev => !prev);
                if (!isEdit && profile) {
                  setEditFormData({ ...profile });
                }
              } else if (activeTab === 'business-hours') {
                navigate('/merchant/business-hours');
              } else if (activeTab === 'break-hours') {
                navigate('/merchant/break-hours');
              }
            }}
          >
            {activeTab === 'profile' ? (isEdit ? 'Cancel Edit' : 'Edit Profile') : 'Edit Section'}
          </Button>
        </div> */}
      </div>
    </aside>
  );

  const editForm = (
    <>
      <form onSubmit={handleUserDetailsSave}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="mb-2">
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.business_name ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, business_name: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="merchantType" className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Type
            </label>
            <input
              type="text"
              id="merchantType"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.merchant_type ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, merchant_type: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              id="address"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.address ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, address: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              id="city"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.city ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, city: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <input
              type="text"
              id="province"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.province ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, province: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 mb-2">
              Barangay
            </label>
            <input
              type="text"
              id="barangay"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.barangay ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, barangay: e.target.value }))}
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
    <div className="pt-16 lg:pt-6 min-h-screen bg-gray-50 select-none lg:pl-[var(--merchant-navbar-width,18rem)]">
      <MerchantNavbar />
      <div className="w-full px-4 py-6 lg:px-6 lg:px-8 box-border">
        {/* Profile Header */}
        {(!isMobile || activeTab == 'profile' ) && <div className="relative mb-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative h-36 sm:h-72 bg-gray-100">
            <img
              src={profile?.exterior_photo || '/logo_new_small.png'}
              alt={profile?.business_name || 'Merchant cover photo'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          </div>
          <div className="absolute inset-0 flex items-end">
            <div className="flex w-full flex-col gap-3 p-4 sm:p-6 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 text-white">
                <h1 className="truncate text-2xl sm:text-3xl font-cursive font-bold">{profile?.business_name}</h1>
                <p className="mt-1 text-sm sm:text-base text-white/90">{profile?.merchant_type}</p>
                <div className="mt-1 line-clamp-2 text-xs sm:text-sm text-white/80">
                  {profile?.address}, {profile?.city}, {profile?.province}, {profile?.barangay}
                </div>
              </div>
            </div>
          </div>
        </div>}

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:hidden flex gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="hidden md:block">
            {profileSidebar}
          </div>

          <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm overflow-hidden">
            {activeTab === 'profile' && (
            <div className="space-y-6 h-full overflow-y-hidden">
              <div className="flex flex-row justify-between items-center px-6 pt-6">
                <h2 className="text-xl font-cursive font-semibold text-gray-800">Profile</h2>
                {/* <button
                  onClick={() => {
                    
                  }}                  
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button> */}
              </div>
              
              <div className="h-[calc(100%-4rem)] overflow-y-auto p-6">
                {isEdit? editForm : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="mb-4">
                      <p className="text-gray-600">Business Name:</p>
                      <p className="font-semibold">{profile?.business_name}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">Merchant Type:</p>
                      <p className="font-semibold">{profile?.merchant_type}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">Address:</p>
                      <p className="font-semibold">{profile?.address}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">City:</p>
                      <p className="font-semibold">{profile?.city}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">Province:</p>
                      <p className="font-semibold">{profile?.province}</p>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-600">Barangay:</p>
                      <p className="font-semibold">{profile?.barangay}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {activeTab === 'business-hours' && (
            <div className="space-y-6 h-full overflow-y-hidden">
              <div className="flex flex-row justify-between items-center px-6 pt-6">
                <h2 className="text-xl font-cursive font-semibold text-gray-800">Business Hours</h2>
                <button
                  onClick={() => {
                    navigate("/merchant/business-hours")
                  }}                  
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
              </div>
              
              <div className="h-[calc(100%-4rem)] overflow-y-auto p-6">
                {isBusinessHoursEdit? (
                  <form onSubmit={handleBusinessHoursSave}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {editBusinessHoursFormData?.map((hours, index) => (
                        <div key={index} className="mb-4">
                          <p className="text-gray-600">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][hours.day_of_week]}:</p>
                          <div className="flex space-x-2">
                            <input
                              type="time"
                              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={hours.open_time}
                              onChange={(e) => {
                                const newFormData = [...editBusinessHoursFormData];
                                newFormData[index].open_time = e.target.value;
                                setEditBusinessHoursFormData(newFormData);
                              }}
                            />
                            <input
                              type="time"
                              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              value={hours.close_time}
                              onChange={(e) => {
                                const newFormData = [...editBusinessHoursFormData];
                                newFormData[index].close_time = e.target.value;
                                setEditBusinessHoursFormData(newFormData);
                              }}
                            />
                          </div>
                        </div>
                      ))}
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
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Business Hours Display */}
                    {profile?.business_hours && profile.business_hours.length > 0 ? (
                      profile.business_hours.map((hours, index) => (
                        <div key={index} className="mb-4">
                          <p className="text-gray-600">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][hours.day_of_week]}:</p>
                          <p className="font-semibold">
                            {new Date(`2000-01-01T${hours.open_time}`).toLocaleTimeString('en-US', { 
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true 
                            })} - {new Date(`2000-01-01T${hours.close_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No business hours set.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}

            {activeTab === 'break-hours' && (
            <div className="space-y-6 h-full overflow-y-hidden pb-20">
              <div className="flex flex-row justify-between items-center px-6 pt-6">
                <h2 className="text-xl font-cursive font-semibold text-gray-800">Break Hours</h2>
                <button
                  onClick={() => {
                    navigate("/merchant/break-hours")
                  }}                  
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Edit
                </button>
              </div>

              <div className="px-6">
                <p className="text-gray-600">Set the hours to help notify pet owners that you're on a break and the business is temporarily closed.</p>
              </div>
              
              <div className="h-[calc(100%-4rem)] overflow-y-auto p-6">
                {profile?.break_hours && profile.break_hours.length > 0 ? (
                  <div className="space-y-6">
                    {[0,1,2,3,4,5,6].map((dayIndex) => {
                      const dayBreaks = profile.break_hours?.filter(h => h.day_of_week === dayIndex) || [];
                      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex];
                      
                      return (
                        <div key={dayIndex} className="border-b pb-4 last:border-b-0">
                          <p className="text-gray-600 font-medium mb-2">{dayName}:</p>
                          {dayBreaks.length > 0 ? (
                            <div className="space-y-2 pl-4">
                              {dayBreaks.map((hours, idx) => (
                                <div key={idx} className="flex items-center">
                                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                                  <p className="font-semibold">
                                    {new Date(`2000-01-01T${hours.break_start}`).toLocaleTimeString('en-US', { 
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true 
                                    })} - {new Date(`2000-01-01T${hours.break_end}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                    {hours.label && <span className="ml-2 text-gray-500">({hours.label})</span>}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic pl-4">No break hours set</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-600">No break hours set.</p>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantProfilePage;
