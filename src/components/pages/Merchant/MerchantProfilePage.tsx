import { useState, useEffect } from 'react';
import { User, History, Heart, Save, PawPrint, CalendarX, Edit3 } from 'lucide-react';
import Button from '../../common/Button';
import { loginService } from '../../../services/auth/auth-service';
import { useNavigate } from 'react-router-dom';
import { ToastService } from '../../../services/toast/toast-service';
import PawLoading from '../../common/PawLoading';
import useScreenSize from '../../../hooks/useScreenSize';
import MerchantNavbar from '../../common/MerchantNavbar';
import { MerchantProfileService } from '../../../services/profile/merchant-profile-service';
import SetBreakHours from './SetBreakHours/SetBreakHoursPage';
import Autocomplete from '../../common/Autocomplete';
import { LocationService } from '../../../services/location/location-service';
import LocationPicker from '../../common/LocationPicker';

export interface MerchantProfile {
  id?: string;
  business_name?: string;
  merchant_type?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  province?: string;
  barangay?: string;
  longitude?: number;
  latitude?: number;
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
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [editedLocation, setEditedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationSearchValue, setLocationSearchValue] = useState('');

  const dataService = new MerchantProfileService();
  const locationService = new LocationService();
  const navigate  = useNavigate();

  const { isMobile } = useScreenSize();

  useEffect(() => {
    document.title = 'My Profile - FURK';
    getUserDetails();
    setProvinces(locationService.getProvinces());

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
      const lat = response.data?.latitude;
      const lng = response.data?.longitude;
      if (typeof lat === 'number' && typeof lng === 'number') {
        setEditedLocation({ latitude: lat, longitude: lng });
      } else {
        setEditedLocation({ latitude: 14.5995, longitude: 120.9842 });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editFormData?.province) {
      setCities(locationService.getCities(editFormData.province));
    } else {
      setCities([]);
    }
  }, [editFormData?.province]);

  useEffect(() => {
    if (editFormData?.province && editFormData.city) {
      setBarangays(locationService.getBarangays(editFormData.province, editFormData.city));
    } else {
      setBarangays([]);
    }
  }, [editFormData?.city]);

  useEffect(() => {
    const parts = [
      editFormData?.barangay?.trim(),
      editFormData?.city?.trim(),
      editFormData?.province?.trim(),
    ].filter(Boolean);

    setLocationSearchValue(parts.join(', '));
  }, [editFormData?.barangay, editFormData?.city, editFormData?.province]);

  const isValidPhoneNumber = (value?: string) => {
    if (!value) return false;
    const normalized = value.replace(/\s+/g, '');
    return /^\+63\d{10}$/.test(normalized) || /^09\d{9}$/.test(normalized);
  };

  const canSaveProfile = Boolean(
    editFormData &&
    editFormData.business_name?.trim() &&
    editFormData.address?.trim() &&
    editFormData.province?.trim() &&
    editFormData.city?.trim() &&
    editFormData.barangay?.trim() &&
    isValidPhoneNumber(editFormData.phone_number)
  );

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

      const [detailsResponse, locationResponse] = await Promise.all([
        dataService.updateMerchantDetails({
          business_name: editFormData.business_name,
          phone_number: editFormData.phone_number,
          address: editFormData.address,
          city: editFormData.city,
          province: editFormData.province,
          barangay: editFormData.barangay,
        }),
        editedLocation
          ? dataService.updateMerchantLocation(
              editedLocation.longitude,
              editedLocation.latitude
            )
          : Promise.resolve(null),
      ]);

      const updatedProfile = {
        ...(detailsResponse?.data ?? editFormData),
        ...(locationResponse?.data ?? {}),
        longitude: locationResponse?.data?.longitude ?? editedLocation?.longitude,
        latitude: locationResponse?.data?.latitude ?? editedLocation?.latitude,
      };
      setProfile(prev => ({
        ...prev,
        ...updatedProfile,
      }));
      setEditFormData(prev => ({
        ...prev,
        ...updatedProfile,
      }));
      setIsEdit(false);
      ToastService.show("Merchant profile updated successfully!");
    } catch (error) {
      console.error("Error updating merchant profile:", error);
      const message = (error as any)?.response?.data?.error || "Failed to update merchant profile.";
      ToastService.show(message);
    } finally {
      setLoadingSave(false);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Type
            </label>
            <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {editFormData?.merchant_type || profile?.merchant_type || 'Merchant'}
            </div>
          </div>

          <div className="mb-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              maxLength={13}
              placeholder="+639XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={editFormData?.phone_number ?? ''}
              onChange={(e) => setEditFormData(prev => ({ ...prev!, phone_number: e.target.value }))}
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
              Province
            </label>
            <Autocomplete
              options={provinces.map(province => ({ value: province }))}
              value={editFormData?.province ? { value: editFormData.province } : null}
              onChange={(value) => {
                const provinceValue =
                  value && typeof value === 'object' && 'value' in value
                    ? String(value.value)
                    : '';

                setEditFormData(prev => ({
                  ...prev!,
                  province: provinceValue,
                  city: '',
                  barangay: ''
                }));

                if (provinceValue) {
                  setCities(locationService.getCities(provinceValue));
                } else {
                  setCities([]);
                }
                setBarangays([]);
              }}
              onSearch={async (query) => {
                const allProvinces = locationService.getProvinces();
                setProvinces(
                  query
                    ? allProvinces.filter(province =>
                        province.toLowerCase().includes(query.toLowerCase())
                      )
                    : allProvinces
                );
              }}
              getOptionLabel={(option: { value: string }) => option.value}
              placeholder="Select province"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City/Municipality
            </label>
            <Autocomplete
              options={cities.map(city => ({ value: city }))}
              value={editFormData?.city ? { value: editFormData.city } : null}
              onChange={(value) => {
                const cityValue =
                  value && typeof value === 'object' && 'value' in value
                    ? String(value.value)
                    : '';

                setEditFormData(prev => ({
                  ...prev!,
                  city: cityValue,
                  barangay: ''
                }));

                if (cityValue && editFormData?.province) {
                  setBarangays(locationService.getBarangays(editFormData.province, cityValue));
                } else {
                  setBarangays([]);
                }
              }}
              onSearch={async (query) => {
                if (!editFormData?.province) return;

                const allCities = locationService.getCities(editFormData.province);
                setCities(
                  query
                    ? allCities.filter(city =>
                        city.toLowerCase().includes(query.toLowerCase())
                      )
                    : allCities
                );
              }}
              getOptionLabel={(option: { value: string }) => option.value}
              placeholder="Select city"
            />
          </div>

          <div className="mb-2">
            <label htmlFor="barangay" className="block text-sm font-medium text-gray-700 mb-2">
              Barangay
            </label>
            <Autocomplete
              options={barangays.map(barangay => ({ value: barangay }))}
              value={editFormData?.barangay ? { value: editFormData.barangay } : null}
              onChange={(value) => {
                const barangayValue =
                  value && typeof value === 'object' && 'value' in value
                    ? String(value.value)
                    : '';
                setEditFormData(prev => ({ ...prev!, barangay: barangayValue }));
              }}
              onSearch={async (query) => {
                if (!editFormData?.province || !editFormData?.city) return;

                const allBarangays = locationService.getBarangays(editFormData.province, editFormData.city);
                setBarangays(
                  query
                    ? allBarangays.filter(barangay =>
                        barangay.toLowerCase().includes(query.toLowerCase())
                      )
                    : allBarangays
                );
              }}
              getOptionLabel={(option: { value: string }) => option.value}
              placeholder="Select barangay"
            />
          </div>

          <div className="mb-2 md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
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

          <div className="md:col-span-2">
            <div className="flex flex-row justify-between items-center gap-4 mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Business Location Map</p>
                <p className="text-xs text-gray-500">Drag the pin or click the map to update the saved merchant location.</p>
              </div>
            </div>
            {editedLocation ? (
              <LocationPicker
                initialLat={editedLocation.latitude}
                initialLng={editedLocation.longitude}
                enableSearch
                searchValue={locationSearchValue}
                autoSelectFirstResult
                searchLocations={async (query) => {
                  try {
                    const response: any = await dataService.searchLocations(query, 6);
                    return response?.data || [];
                  } catch {
                    return [];
                  }
                }}
                onChange={(lat, lng) => setEditedLocation({ latitude: lat, longitude: lng })}
              />
            ) : (
              <div className="w-full h-96 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
                Loading map...
              </div>
            )}
            {editedLocation && (
              <p className="mt-3 text-sm text-gray-600">
                Lat: {editedLocation.latitude.toFixed(6)} | Lng: {editedLocation.longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>
        
        <div className="w-full flex flex-row justify-end items-center">
            <Button
              type='submit'
              variant="primary"
              className="ml-2"
              icon={<Save size={18} />}
              loading={loadingSave}
              disabled={loadingSave || !canSaveProfile}
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
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit3 size={16} />}
                  onClick={() => {
                    if (!isEdit && profile) {
                      setEditFormData({ ...profile });
                    }
                    setIsEdit(prev => !prev);
                  }}
                >
                  {isEdit ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
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
                      <p className="text-gray-600">Mobile Number:</p>
                      <p className="font-semibold">{profile?.phone_number || 'No mobile number set'}</p>
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
