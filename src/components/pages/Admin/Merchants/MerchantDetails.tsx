import { useState } from 'react';
import { Check, X, ExternalLink, Image as ImageIcon, FileText, AlertTriangle, Play, Maximize2 } from 'lucide-react';
import { AdminDashboardService } from '../../../../services/admin/admin-dashboard-service';
import { ToastService } from '../../../../services/toast/toast-service';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmButtonClass: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  confirmButtonClass,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-yellow-500 mr-3" size={24} />
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 text-white rounded-lg ${confirmButtonClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

interface MerchantDetailsProps {
  merchant: any;
  onStatusChange?: () => void;
}

const MerchantDetails: React.FC<MerchantDetailsProps> = ({ merchant, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const getAttachmentValue = (attachments: any[], key: string) => {
    const attachment = attachments.find(a => Object.keys(a)[0] === key);
    return attachment ? attachment[key] : '';
  };

  const dataService = new AdminDashboardService();

  const onApprove = () => {
    setApproveLoading(true);
    dataService.approveService(merchant.id).then((res: any) => {
      if (res?.success) {
        // Update the merchant status locally to avoid needing a refresh
        merchant.status = 'verified';
        
        // Notify parent component about the status change
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        ToastService.show('Failed to approve merchant');
      }
    }).catch((error) => {
      console.error('Error approving merchant:', error);
      ToastService.show('Error approving merchant: ' + (error.message || 'Unknown error'));
    }).finally(() => {
      setApproveLoading(false);
    });
  }

  const onReject = () => {
    setRejectLoading(true);
    dataService.rejectService(merchant.id).then((res: any) => {
      if (res?.success) {
        // Update the merchant status locally to avoid needing a refresh
        merchant.status = 'rejected';
        
        // Notify parent component about the status change
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        ToastService.show('Failed to reject merchant');
      }
    }).catch((error) => {
      console.error('Error rejecting merchant:', error);
      ToastService.show('Error rejecting merchant: ' + (error.message || 'Unknown error'));
    }).finally(() => {
      setRejectLoading(false);
    });
  }

  // Function to get status badge color based on merchant status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Function to get status display text
  const getStatusDisplayText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'verified':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {merchant.business_name}
          </h2>
          <div className={`px-3 py-1 rounded-full border ${getStatusBadgeColor(merchant.status)}`}>
            {getStatusDisplayText(merchant.status)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-gray-500">Application ID: {merchant.id}</p>
            <p className="text-gray-500 mt-1">Type: {merchant.merchant_type}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm">
              Created: {new Date(merchant.created_at).toLocaleString()}
            </p>
            {merchant.updated_at && (
              <p className="text-gray-500 text-sm mt-1">
                Last Updated: {new Date(merchant.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
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
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'notes'
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    {merchant.business_types?.length > 0 ? (
                      merchant.business_types.map((type: any, index: number) => (
                        <span 
                          key={index} 
                          className="px-2 py-1 bg-primary-50 text-primary-700 text-sm rounded-md border border-primary-100"
                        >
                          {type.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No business types specified</span>
                    )}
                  </div>
                </div>
                {/* Add more business details */}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {merchant.merchant_type === 'FREELANCE' ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Freelancer Documents</h3>
                  <span className="text-sm text-gray-500">
                    {merchant.attachments?.length > 0 ? 
                      `${merchant.attachments.filter((a: any) => a[Object.keys(a)[0]]).length} documents uploaded` : 
                      'No documents uploaded'}
                  </span>
                </div>
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
            )

             : merchant.merchant_type === 'BUSINESS' ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Business Documents</h3>
                  <span className="text-sm text-gray-500">
                    {merchant.attachments?.length > 0 ? 
                      `${merchant.attachments.filter((a: any) => a[Object.keys(a)[0]]).length} documents uploaded` : 
                      'No documents uploaded'}
                  </span>
                </div>
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
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <AlertTriangle size={48} className="mb-4 text-yellow-500" />
                <p className="text-lg font-medium">Unknown Merchant Type</p>
                <p className="mt-2">The merchant type '{merchant.merchant_type}' is not recognized.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                {merchant.merchant_type === 'FREELANCE' ? 'Freelancer Photos & Videos' : 
                 merchant.merchant_type === 'BUSINESS' ? 'Business Photos & Videos' : 
                 'Photos & Videos'}
              </h3>
              <span className="text-sm text-gray-500">
                {merchant.attachments?.filter((a: any) => {
                  const key = Object.keys(a)[0];
                  return (key.includes('photo') || key.includes('video')) && a[key];
                }).length || 0} media items uploaded
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {merchant.merchant_type === 'FREELANCE' ? (
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
            ) : merchant.merchant_type === 'BUSINESS' ? (
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
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-10 text-gray-500">
                <AlertTriangle size={48} className="mb-4 text-yellow-500" />
                <p className="text-lg font-medium">Unknown Merchant Type</p>
                <p className="mt-2">The merchant type '{merchant.merchant_type}' is not recognized.</p>
              </div>
            )}
          </div>
        </>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Admin Notes</h3>
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </span>
            </div>
            
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div>
                <label htmlFor="admin-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Private Notes
                </label>
                <textarea
                  id="admin-notes"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[150px]"
                  placeholder="Add private notes about this merchant application..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">These notes are only visible to administrators.</p>
              </div>
              
              <div className="flex justify-end">
                <button
                  className={`px-4 py-2 bg-primary-600 text-white rounded-lg flex items-center ${isSavingNotes ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary-700'}`}
                  onClick={() => {
                    setIsSavingNotes(true);
                    // Simulate saving notes to the backend
                    setTimeout(() => {
                      ToastService.show('Notes saved successfully');
                      setIsSavingNotes(false);
                    }, 800);
                  }}
                  disabled={isSavingNotes}
                >
                  {isSavingNotes ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Notes'}
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg border p-6">
              <h4 className="font-medium text-gray-900 mb-4">Activity History</h4>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-primary-100 rounded-full p-2 mr-3">
                    <Check size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Application created</p>
                    <p className="text-xs text-gray-500">{new Date(merchant.created_at).toLocaleString()}</p>
                  </div>
                </div>
                {merchant.status !== 'pending' && (
                  <div className="flex items-start">
                    <div className={`rounded-full p-2 mr-3 ${merchant.status === 'verified' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {merchant.status === 'verified' ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <X size={16} className="text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Application {merchant.status === 'verified' ? 'approved' : 'rejected'}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(merchant.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Action Buttons */}
      <div className="p-6 border-t bg-gray-50">
        <div className="flex justify-end space-x-4">
          {merchant.status === 'pending' && 
            <button
              className={`px-4 py-2 border border-red-500 text-red-500 rounded-lg flex items-center justify-center min-w-[160px] ${
                approveLoading || rejectLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-red-50'
              }`}
              onClick={() => setShowRejectConfirm(true)}
              disabled={approveLoading || rejectLoading}
            >
              {rejectLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rejecting...
                </>
              ) : (
                'Reject Application'
              )}
            </button>
          }
          {merchant.status === 'pending' &&
            <button
              className={`px-4 py-2 bg-green-700 text-white rounded-lg flex items-center justify-center min-w-[160px] ${
                rejectLoading || approveLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-green-800'
              }`}
              onClick={() => setShowApproveConfirm(true)}
              disabled={rejectLoading || approveLoading}
            >
              {approveLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving...
                </>
              ) : (
                'Approve Application'
              )}
            </button>
          }
        </div>
      </div>
      
      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        title="Approve Merchant"
        message={`Are you sure you want to approve ${merchant.business_name}? This will grant them access to the platform.`}
        confirmText="Approve"
        cancelText="Cancel"
        confirmButtonClass="bg-green-700 hover:bg-green-800"
        onConfirm={() => {
          setShowApproveConfirm(false);
          onApprove();
        }}
        onCancel={() => setShowApproveConfirm(false)}
      />
      
      <ConfirmDialog
        isOpen={showRejectConfirm}
        title="Reject Merchant"
        message={`Are you sure you want to reject ${merchant.business_name}? They will need to reapply to join the platform.`}
        confirmText="Reject"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => {
          setShowRejectConfirm(false);
          onReject();
        }}
        onCancel={() => setShowRejectConfirm(false)}
      />
    </div>
  );
};

interface DocumentItemProps {
  name: string;
  url: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ name, url }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`flex items-center justify-between p-4 border rounded-lg transition-all duration-200 ${url ? 'hover:border-primary-300 hover:shadow-sm' : ''} ${isHovered ? 'bg-gray-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center">
        <FileText size={20} className={`mr-3 ${url ? 'text-primary-500' : 'text-gray-400'}`} />
        <div>
          <h4 className="font-medium text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">
            {url ? (
              <span className="text-primary-600">Uploaded</span>
            ) : (
              <span className="text-gray-400">Not uploaded</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {url && (
          <>
            <button
              className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
              onClick={() => window.open(url, '_blank')}
              title="Open document in new tab"
            >
              <ExternalLink size={20} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

interface PhotoItemProps {
  name: string;
  url: string;
  isVideo?: boolean;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ name, url, isVideo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
      <div 
        className={`aspect-w-16 aspect-h-9 bg-gray-100 flex items-center justify-center relative ${url ? 'cursor-pointer' : ''}`}
        onClick={() => url && setIsExpanded(!isExpanded)}
      >
        {url ? (
          isVideo ? (
            <>
              <video
                src={url}
                controls={isExpanded}
                className="w-full h-full object-cover"
              />
              {!isExpanded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-opacity">
                  <Play size={48} className="text-white opacity-80" />
                </div>
              )}
            </>
          ) : (
            <>
              <img
                src={url}
                alt={name}
                className="w-full h-full object-cover"
              />
              {!isExpanded && (
                <div className="absolute inset-0 flex items-center justify-center hover:bg-black hover:bg-opacity-10 transition-opacity">
                  <Maximize2 size={32} className="text-white opacity-0 hover:opacity-80 transition-opacity" />
                </div>
              )}
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <ImageIcon size={32} />
            <span className="text-sm mt-2">No {isVideo ? 'video' : 'image'} uploaded</span>
          </div>
        )}
      </div>
      <div className="p-4 flex justify-between items-center">
        <h4 className="font-medium text-gray-900">{name}</h4>
        {url && (
          <button
            className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-full transition-colors"
            onClick={() => window.open(url, '_blank')}
            title={`Open ${isVideo ? 'video' : 'image'} in new tab`}
          >
            <ExternalLink size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MerchantDetails;