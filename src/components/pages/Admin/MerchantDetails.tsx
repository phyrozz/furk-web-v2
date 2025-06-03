import { useState } from 'react';
import { Check, X, ExternalLink, Image as ImageIcon, FileText } from 'lucide-react';
import { AdminDashboardService } from '../../../services/admin/admin-dashboard-service';
import { ToastService } from '../../../services/toast/toast-service';

interface MerchantDetailsProps {
  merchant: any;
}

const MerchantDetails: React.FC<MerchantDetailsProps> = ({ merchant }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

  const getAttachmentValue = (attachments: any[], key: string) => {
    const attachment = attachments.find(a => Object.keys(a)[0] === key);
    return attachment ? attachment[key] : '';
  };

  const dataService = new AdminDashboardService();

  const onApprove = () => {
    setApproveLoading(true);
    dataService.approveService(merchant.id).then((res: any) => {
      if (res?.success) {
        ToastService.show('Merchant approved successfully');
      } else {
        ToastService.show('Failed to approve merchant');
      }
      setApproveLoading(false);
    }).finally(() => {
      setApproveLoading(false);
    });
  }

  const onReject = () => {
    setRejectLoading(true);
    dataService.rejectService(merchant.id).then((res: any) => {
      if (res?.success) {
        ToastService.show('Merchant rejected successfully');
      } else {
        ToastService.show('Failed to reject merchant');
      }
      setRejectLoading(false);
    }).finally(() => {
      setRejectLoading(false);
    });
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-gray-900">
          {merchant.business_name}
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
                  <p className="mt-1">{merchant.business_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Business Type(s)
                  </label>
                  <p className="mt-1">
                    {merchant.business_types?.map((type: any) => type.name).join(', ')}
                  </p>
                </div>
                {/* Add more business details */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {merchant.merchant_type === 'FREELANCE' && (
              <>
                <DocumentItem
                  name="CV/Resume"
                  url={getAttachmentValue(merchant.attachments, 'cv')}
                />
                <DocumentItem
                  name="Current Address Proof"
                  url={getAttachmentValue(merchant.attachments, 'current_address_proof')}
                />
                <DocumentItem
                  name="Permanent Address Proof"
                  url={getAttachmentValue(merchant.attachments, 'permanent_address_proof')}
                />
                <DocumentItem
                  name="SSS/UMID"
                  url={getAttachmentValue(merchant.attachments, 'sss_umid')}
                />
                <DocumentItem
                  name="BIR TIN"
                  url={getAttachmentValue(merchant.attachments, 'bir_tin')}
                />
                <DocumentItem
                  name="Other Valid ID"
                  url={getAttachmentValue(merchant.attachments, 'other_valid_id')}
                />
                <DocumentItem
                  name="NBI Clearance"
                  url={getAttachmentValue(merchant.attachments, 'nbi_clearance')}
                />
              </>
            )}

            {merchant.merchant_type === 'BUSINESS' && (
              <>
                <DocumentItem
                  name="Company Profile"
                  url={getAttachmentValue(merchant.attachments, 'company_profile')}
                />
                <DocumentItem
                  name="DTI/SEC Registration"
                  url={getAttachmentValue(merchant.attachments, 'dti_sec')}
                />
                <DocumentItem
                  name="BIR 2303/COR"
                  url={getAttachmentValue(merchant.attachments, 'bir_2303')}
                />
                <DocumentItem
                  name="Mayor's Permit"
                  url={getAttachmentValue(merchant.attachments, 'mayors_permit')}
                />
                <DocumentItem
                  name="Valid ID 1"
                  url={getAttachmentValue(merchant.attachments, 'valid_id_1')}
                />
                <DocumentItem
                  name="Valid ID 2"
                  url={getAttachmentValue(merchant.attachments, 'valid_id_2')}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchant.merchant_type === 'FREELANCE' && (
              <>
                <PhotoItem
                  name="Service Photo 1"
                  url={getAttachmentValue(merchant.attachments, 'service_photo_1')}
                />
                <PhotoItem
                  name="Service Photo 2"
                  url={getAttachmentValue(merchant.attachments, 'service_photo_2')}
                />
                <PhotoItem
                  name="Service Photo 3"
                  url={getAttachmentValue(merchant.attachments, 'service_photo_3')}
                />
                <PhotoItem
                  name="Service Video 1"
                  url={getAttachmentValue(merchant.attachments, 'service_video_1')}
                  isVideo
                />
                <PhotoItem
                  name="Service Video 2"
                  url={getAttachmentValue(merchant.attachments, 'service_video_2')}
                  isVideo
                />
              </>
            )}

            {merchant.merchant_type === 'BUSINESS' && (
              <>
                <PhotoItem
                  name="Exterior Photo"
                  url={getAttachmentValue(merchant.attachments, 'exterior_photo')}
                />
                <PhotoItem
                  name="Interior Photo 1"
                  url={getAttachmentValue(merchant.attachments, 'interior_photo_1')}
                />
                <PhotoItem
                  name="Interior Photo 2"
                  url={getAttachmentValue(merchant.attachments, 'interior_photo_2')}
                />
                <PhotoItem
                  name="Service Video 1"
                  url={getAttachmentValue(merchant.attachments, 'service_video_1')}
                  isVideo
                />
                <PhotoItem
                  name="Service Video 2"
                  url={getAttachmentValue(merchant.attachments, 'service_video_2')}
                  isVideo
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex justify-end space-x-4">
          {merchant.status === 'pending' && 
            <button
              className={`px-4 py-2 border border-red-500 text-red-500 rounded-lg ${
                approveLoading || rejectLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-50'
              }`}
              onClick={onReject}
              disabled={approveLoading || rejectLoading}
            >
              {rejectLoading ? 'Rejecting...' : 'Reject Application'}
            </button>
          }
          {merchant.status === 'pending' &&
            <button
              className={`px-4 py-2 bg-green-700 text-white rounded-lg ${
                rejectLoading || approveLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-green-800'
              }`}
              onClick={onApprove}
              disabled={rejectLoading || approveLoading}
            >
              {approveLoading? 'Approving...' : 'Approve Application'}
            </button>
          }
        </div>
      </div>
    </div>
  );
};

interface DocumentItemProps {
  name: string;
  url: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ name, url }) => (
  <div className="flex items-center justify-between p-4 border rounded-lg">
    <div className="flex items-center">
      <FileText size={20} className="text-gray-400 mr-3" />
      <div>
        <h4 className="font-medium text-gray-900">{name}</h4>
        <p className="text-sm text-gray-500">{url ? 'Uploaded' : 'Not uploaded'}</p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      {url && (
        <button
          className="p-2 text-gray-500 hover:text-gray-700"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink size={20} />
        </button>
      )}
      {/* <button className="p-2 text-green-500 hover:text-green-700">
        <Check size={20} />
      </button>
      <button className="p-2 text-red-500 hover:text-red-700">
        <X size={20} />
      </button> */}
    </div>
  </div>
);

interface PhotoItemProps {
  name: string;
  url: string;
  isVideo?: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ name, url, isVideo }) => (
  <div className="border rounded-lg overflow-hidden">
    <div className="aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center">
      {url ? (
        isVideo ? (
          <video
            src={url}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={url}
            alt={name}
            className="w-full h-full object-cover"
          />
        )
      ) : (
        <ImageIcon size={32} className="text-gray-400" />
      )}
    </div>
    <div className="p-4">
      <h4 className="font-medium text-gray-900">{name}</h4>
      {/* <div className="flex justify-between items-center mt-2">
        <button className="text-green-500 hover:text-green-700">
          <Check size={20} />
        </button>
        <button className="text-red-500 hover:text-red-700">
          <X size={20} />
        </button>
      </div> */}
    </div>
  </div>
);

export default MerchantDetails;