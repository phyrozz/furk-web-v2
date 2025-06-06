import { useState, useEffect } from 'react';
import { User, Settings, History, Heart, LogOut } from 'lucide-react';
import Button from '../../common/Button';

interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  joinDate: string;
  location: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
}

const MerchantProfilePage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update page title
    document.title = 'My Profile - FURK';

    // Mock profile data - replace with actual API call
    setTimeout(() => {
      setProfile({
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        joinDate: 'January 2024',
        location: 'New York, USA',
        preferences: {
          notifications: true,
          newsletter: false,
          language: 'English'
        }
      });
      setLoading(false);
    }, 1000);

    return () => {
      const defaultTitle = document.querySelector('title[data-default]');
      if (defaultTitle) {
        document.title = defaultTitle.textContent || '';
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce delay-100" />
          <div className="w-4 h-4 rounded-full bg-primary-500 animate-bounce delay-200" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'history', label: 'Service History', icon: History },
    { id: 'favorites', label: 'Favorites', icon: Heart }
  ];

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center">
            <img
              src={profile?.avatar}
              alt={profile?.name}
              className="w-24 h-24 rounded-full border-4 border-primary-100"
            />
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-800">{profile?.name}</h1>
              <p className="text-gray-600">{profile?.email}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span>Member since {profile?.joinDate}</span>
                <span className="mx-2">•</span>
                <span>{profile?.location}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="ml-auto"
              icon={<LogOut size={18} />}
              onClick={() => alert('Implement logout')}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
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
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={profile?.name}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={profile?.email}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={profile?.location}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive notifications about your services</p>
                  </div>
                  <button
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
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Newsletter</h3>
                    <p className="text-sm text-gray-500">Receive updates about new services</p>
                  </div>
                  <button
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
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Language</label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    value={profile?.preferences.language}
                  >
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Service History</h2>
              <p className="text-gray-600">Your service history will appear here</p>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Favorite Services</h2>
              <p className="text-gray-600">Your favorite services will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantProfilePage;