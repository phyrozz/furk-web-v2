import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { User, History, Heart, LogOut, Save, PawPrint, Wallet, PlusCircle, Award, AlertTriangle, Camera, QrCode } from 'lucide-react';
import Button from '../../common/Button';
import { UserProfileService } from '../../../services/profile/user-profile-service';
import Navbar from '../../common/Navbar';
import DateUtils from '../../../utils/date-utils';
import { loginService } from '../../../services/auth/auth-service';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ToastService } from '../../../services/toast/toast-service';
import PawLoading from '../../common/PawLoading';
import BookingHistory from './BookingHistory';
import useScreenSize from '../../../hooks/useScreenSize';
import Favorites from './Favorites';
import PetProfiles from './PetProfiles';
import TransactionHistory from './TransactionHistory';
import RewardTiers from './RewardTiers';
import { UserWallet } from '../../../models/user-wallet';
import { http } from '../../../utils/http';
import TopUpSidebar from './TopUpSidebar';
import { formatAmount } from '../../../utils/currency-utils';

import Modal from '../../common/Modal';
import Input from '../../common/Input';
import { PetOwnerGettingStarted } from '../../common/PetOwnerGettingStarted';
import { S3UploadService } from '../../../services/s3-upload/s3-upload-service';
import ProfileImageUploadModal from './ProfileImageUploadModal';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  phone_number: string;
  image_url?: string;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
  tier_level?: number | null;
  tier_name?: string | null;
  tier_description?: string | null;
  tier_required_furkredits?: number | null;
  tier_icon_key?: string | null;
  tier_color_code?: string | null;
  tier_assigned_at?: string | null;
  pet_owner_qr_token?: string | null;
  pet_owner_qr_payload?: string | null;
}

const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'profile';
  const activeTab = ['profile', 'pets', 'history', 'transactions', 'favorites', 'rewards'].includes(tabParam) ? tabParam : 'profile';
  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params, { replace: true });
  };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editFormData, setEditFormData] = useState<UserProfile | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [userWallet, setUserWallet] = useState<UserWallet | null>(null);
  const [isTopUpSidebarOpen, setIsTopUpSidebarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteAccountEmail, setDeleteAccountEmail] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProfileImageModalOpen, setIsProfileImageModalOpen] = useState(false);
  const [profileImageModalStep, setProfileImageModalStep] = useState<'uploading' | 'applying'>('uploading');
  const [selectedProfileImageName, setSelectedProfileImageName] = useState('');
  const [isOwnerQrModalOpen, setIsOwnerQrModalOpen] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  const dataService = new UserProfileService();
  const uploadService = new S3UploadService();
  const navigate  = useNavigate();
  const cdnUrl = import.meta.env.VITE_CDN_URL || '';

  const { isMobile } = useScreenSize();

  const fetchUserWallet = useCallback(async () => {
    try {
      const response = await http.get<{ data: UserWallet }>('/pet-owner-profile/get-user-wallet');
      setUserWallet(response.data);
    } catch (error) {
      console.error('Failed to fetch user wallet:', error);
      setUserWallet(null);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'My Profile - FURK';

    const loadData = async () => {
      await getUserDetails();
      await fetchUserWallet();
    };
    // Dont run API fetchings concurrently. Wait all to finish before showing the page.
    loadData();

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
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
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

  const handleProfileImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      ToastService.show('Please select an image file');
      if (profileImageInputRef.current) profileImageInputRef.current.value = '';
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      ToastService.show('Image must be 5MB or smaller');
      if (profileImageInputRef.current) profileImageInputRef.current.value = '';
      return;
    }

    try {
      setIsUploadingImage(true);
      setProfileImageModalStep('uploading');
      setSelectedProfileImageName(file.name);
      setIsProfileImageModalOpen(true);

      const uploadResponse: any = await dataService.generateProfileImageUploadUrl(file.type);
      const uploadUrl = uploadResponse?.data?.upload_url;
      const key = uploadResponse?.data?.key;

      if (!uploadUrl || !key) {
        ToastService.show('Failed to prepare upload. Please try again.');
        return;
      }

      await uploadService.uploadToS3ByPresignedUrl(uploadUrl, file);
      setProfileImageModalStep('applying');
      await dataService.updateProfileImage(key);
      ToastService.show('Profile photo updated successfully');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await getUserDetails();
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      if (error?.response?.data?.error) {
        ToastService.show(error.response.data.error);
      } else {
        ToastService.show('Failed to upload profile photo');
      }
    } finally {
      setIsUploadingImage(false);
      setIsProfileImageModalOpen(false);
      setSelectedProfileImageName('');
      if (profileImageInputRef.current) profileImageInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.id) return;
    setIsDeleteModalOpen(false);
    setDeleteAccountLoading(true);

    try {
      setIsDeleting(true);
      await dataService.deleteAccount(profile.id);
      ToastService.show('Account deleted successfully');
      await loginService.logout();
      setDeleteAccountLoading(false);
      navigate('/login');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setDeleteAccountLoading(false);
      if (error?.response?.data?.error) {
        ToastService.show(error?.response?.data?.error);
      } else {
        ToastService.show('Error deleting account');
      }
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center overflow-hidden">
        <PawLoading />
      </div>
    );
  }
  
  const profileImageUrl = profile?.image_url
    ? (profile.image_url.startsWith('http')
      ? profile.image_url
      : `${cdnUrl}/${profile.image_url.replace(/^\/+/, '')}`)
    : null;
  const ownerQrPayload = profile?.pet_owner_qr_payload || profile?.pet_owner_qr_token || '';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'pets', label: 'My Pets', icon: PawPrint },
    // { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'history', label: 'Booking History', icon: History },
    { id: 'transactions', label: 'Transaction History', icon: Wallet },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'rewards', label: 'Reward Tiers', icon: Award }
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
              maxLength={13}
              placeholder="+639XXXXXXXXX"
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

      <div className="pt-16 pb-[calc(5rem_+_env(safe-area-inset-bottom))] min-h-screen bg-gray-50 overflow-x-hidden select-none z-10 lg:pb-0">
        <Navbar />
        <div className="container mx-auto flex min-w-0 flex-col px-4 py-8 box-border">
          <PetOwnerGettingStarted />
          {/* Profile Header */}
          {(!isMobile || activeTab === 'profile') && <div className="mb-6 min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:mb-8">
            <div className="grid min-w-0 gap-5 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-primary-100 bg-gray-200 sm:h-24 sm:w-24">
                    {loading ? (
                      <PawLoading size={40} bounce={false} />
                    ) : (
                      <img
                        src={profileImageUrl ?? "/default_profile.png"}
                        alt={profile?.first_name ? profile.first_name + "'s avatar" : 'Profile avatar'}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute -bottom-2 -right-2 rounded-full bg-primary-600 p-2 text-white shadow-sm hover:bg-primary-700 disabled:opacity-60"
                    title="Change profile photo"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageChange}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="break-words font-cursive text-xl font-bold leading-tight text-gray-800 sm:text-2xl">
                    {profile?.first_name} {profile?.middle_name ?? ''} {profile?.last_name}
                  </h1>
                  <p className="mt-1 break-all text-sm text-gray-600">{profile?.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                    <span>Member since {profile?.created_at && DateUtils.formatDateStringFromTimestamp(profile.created_at)}</span>
                  </div>
                  {profile?.tier_name && (
                    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                      <span
                        className="inline-flex max-w-full break-words items-center rounded-full px-3 py-1 text-sm font-medium"
                        style={{
                          backgroundColor: profile.tier_color_code || '#e5e7eb',
                          color: '#ffffff'
                        }}
                      >
                        {profile.tier_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Subscribed on {profile.tier_assigned_at && DateUtils.formatDateStringFromTimestamp(profile.tier_assigned_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0" id="pet-owner-wallet">
                {userWallet && <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3" id="user-wallet-container">
                  <div className="min-w-0 rounded-xl bg-primary-50 px-3 py-2.5 sm:px-4">
                    <span className="block text-xs font-medium text-gray-500">Furkredits</span>
                    <span className="mt-0.5 block break-words text-lg font-bold text-primary-700 sm:text-xl">{formatAmount(userWallet.furkredits)}</span>
                  </div>
                  <div className="min-w-0 rounded-xl bg-amber-50 px-3 py-2.5 sm:px-4">
                    <span className="block text-xs font-medium text-gray-500">Furkoins</span>
                    <span className="mt-0.5 block break-words text-lg font-bold text-amber-700 sm:text-xl">{userWallet.furkoins}</span>
                  </div>
                </div>}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {userWallet && <>
                    <Button id="pet-owner-top-up" variant="ghost" className="w-full justify-center px-2 sm:w-auto" icon={<PlusCircle />} onClick={() => setIsTopUpSidebarOpen(true)}>Top up</Button>
                    <Button variant="ghost" className="w-full justify-center px-2 sm:w-auto" icon={<QrCode />} onClick={() => setIsOwnerQrModalOpen(true)} disabled={!ownerQrPayload}>
                      My QR
                    </Button>
                  </>}
                  <Button
                    variant="outline"
                    className="col-span-2 w-full justify-center sm:ml-auto sm:w-auto"
                    icon={<LogOut size={18} />}
                    onClick={handleLogout}
                    loading={signOutLoading}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>}

          {/* Navigation Tabs */}
          <nav aria-label="Profile sections" className="mb-5 grid min-w-0 grid-cols-2 gap-2 sm:mb-8 sm:flex sm:flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={'nav-tab-' + tab.id}
                type="button"
                aria-current={activeTab === tab.id ? 'page' : undefined}
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id
                  ? 'flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-left text-xs font-semibold text-primary-700 transition-colors sm:px-4 sm:text-sm'
                  : 'flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 sm:px-4 sm:text-sm'}
              >
                <tab.icon size={17} className="shrink-0" />
                <span className="min-w-0 break-words leading-tight">{tab.label}</span>
              </button>
            ))}
          </nav>
          {/* Tab Content */}
          <div className="min-w-0 overflow-x-hidden rounded-xl bg-white shadow-sm">
            {activeTab === 'profile' && (
              <div className="space-y-6">
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
                
                <div className="p-6">
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
                      <div className="md:col-span-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-800">Pet Owner QR</h3>
                            <p className="text-sm text-gray-500">
                              Show this QR for services that do not require a pet during check-in.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            icon={<QrCode size={18} />}
                            onClick={() => setIsOwnerQrModalOpen(true)}
                            disabled={!ownerQrPayload}
                          >
                            Open QR
                          </Button>
                        </div>
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
                  
                  {!isEdit && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Danger Zone</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <Button
                        variant="primary"
                        color="red"
                        onClick={() => setIsDeleteModalOpen(true)}
                        icon={<AlertTriangle size={18} />}
                        loading={deleteAccountLoading}
                      >
                        Delete Account
                      </Button>
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

            {activeTab === 'rewards' && (
              <div className="overflow-y-hidden h-full">
                <RewardTiers />
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileImageUploadModal
        isOpen={isProfileImageModalOpen}
        onClose={() => {
          if (!isUploadingImage) {
            setIsProfileImageModalOpen(false);
          }
        }}
        fileName={selectedProfileImageName}
        step={profileImageModalStep}
      />

      <Modal
        isOpen={isOwnerQrModalOpen}
        onClose={() => setIsOwnerQrModalOpen(false)}
        title="Pet Owner QR Code"
      >
        <div className="flex flex-col items-center justify-center gap-3">
          {ownerQrPayload ? (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(ownerQrPayload)}`}
              alt="Pet Owner QR Code"
              className="w-72 h-72 rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-72 h-72 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-500 text-sm text-center px-4">
              Unable to load your QR code right now.
            </div>
          )}
          <p className="text-sm text-center text-gray-500">
            Present this QR code to the merchant for services that do not require a pet to be selected.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {setIsDeleteModalOpen(false); setDeleteAccountEmail('')}}
        title="Delete Account"
        showConfirm
        showCancel
        confirmButtonColor="red"
        onConfirm={handleDeleteAccount}
        confirmDisabled={isDeleting || deleteAccountEmail !== profile?.email}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center text-red-600 mb-4">
            <AlertTriangle size={48} />
          </div>
          <p className="text-center text-gray-600">
            Are you sure you want to delete your account? This action cannot be undone.
            All your data, including pet profiles and booking history, will be permanently removed.
          </p>

          <Input
            id="delete-account-input"
            label="Enter your email to confirm"
            type="email"
            placeholder="your.email@example.com"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            value={deleteAccountEmail}
            onChange={(e) => setDeleteAccountEmail(e.target.value)}
            required
          />

          {isDeleting && (
            <div className="flex justify-center mt-4">
              <PawLoading />
            </div>
          )}
        </div>
      </Modal>

    </>
  );
};

export default ProfilePage;
