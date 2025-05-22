import { useState } from 'react';
import { Check, X, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface MerchantDetailsProps {
  merchant: any;
}

const MerchantDetails: React.FC<MerchantDetailsProps> = ({ merchant }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const requirements = [
    { name: 'Company Profile', type: 'document', status: 'pending' },
    { name: 'DTI/SEC Registration', type: 'document', status: 'pending' },
    { name: 'BIR 2303/COR', type: 'document', status: 'pending' },
    { name: "Mayor's Permit", type: 'document', status: 'pending' },
    { name: 'Valid ID 1', type: 'document', status: 'pending' },
    { name: 'Valid ID 2', type: 'document', status: 'pending' },
    { name: 'Exterior Photo', type: 'image', status: 'pending' },
    { name: 'Interior Photo 1', type: 'image', status: 'pending' },
    { name: 'Interior Photo 2', type: 'image', status: 'pending' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          {merchant.name}
        </h2>
        <p className="text-gray-500">Application ID: {merchant.id}</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'documents'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'photos'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('photos')}
          >
            Photos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Business Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Business Name
                  </label>
                  <p className="mt-1">Sample Pet Shop</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Business Type
                  </label>
                  <p className="mt-1">Pet Shop & Grooming</p>
                </div>
                {/* Add more business details */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {requirements.filter(req => req.type === 'document').map((req) => (
              <div
                key={req.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h4 className="font-medium text-gray-900">{req.name}</h4>
                  <p className="text-sm text-gray-500">PDF, 2.3MB</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    onClick={() => window.open('#', '_blank')}
                  >
                    <ExternalLink size={20} />
                  </button>
                  <button className="p-2 text-green-500 hover:text-green-700">
                    <Check size={20} />
                  </button>
                  <button className="p-2 text-red-500 hover:text-red-700">
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.filter(req => req.type === 'image').map((photo) => (
              <div
                key={photo.name}
                className="border rounded-lg overflow-hidden"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-400" />
                </div>
                <div className="p-4">
                  <h4 className="font-medium text-gray-900">{photo.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <button className="text-green-500 hover:text-green-700">
                      <Check size={20} />
                    </button>
                    <button className="text-red-500 hover:text-red-700">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
            onClick={() => {/* Handle rejection */}}
          >
            Reject Application
          </button>
          <button
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            onClick={() => {/* Handle approval */}}
          >
            Approve Merchant
          </button>
        </div>
      </div>
    </div>
  );
};

export default MerchantDetails;