import { useState, useEffect } from 'react';
import { Edit, Trash2, ExternalLink, Image as ImageIcon, AlertTriangle, Check, X } from 'lucide-react';
import { ToastService } from '../../../../services/toast/toast-service';
import { Service } from './types';
import { http } from '../../../../utils/http';
import Button from '../../../common/Button';
import { useNavigate } from 'react-router-dom';

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

interface ServiceDetailsProps {
  service: Service;
  onStatusChange?: () => void;
}

const ServiceDetails: React.FC<ServiceDetailsProps> = ({ service, onStatusChange }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/merchant/edit-service/${service.id}`);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await http.post<{success: boolean, message: string}>(`/merchant-service/delete`, {
        id: service.id
      });

      if (response.success) {
        ToastService.show('Service deleted successfully');
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        ToastService.show('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      ToastService.show('Error deleting service');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to get status badge color based on service status
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow select-none">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {service.name}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="flex items-center gap-2"
              color="primary"
              variant="ghost"
              size="sm"
            >
              <Edit size={16} />
              Edit
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2"
              variant="ghost"
              color="red"
              size="sm"
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-sm text-gray-500">Category: {service.service_category_name}</p>
          </div>
        </div>
        {service.payout_per_completion && (
          <p className="text-sm text-green-600 font-bold mt-1">
            Per-Completion Payout
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'details'
                ? 'md:border-b-2 border-b-0 border-t-2 md:border-t-0 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Service Details
          </button>
          <button
            className={`px-6 py-3 font-medium ${
              activeTab === 'attachments'
                ? 'md:border-b-2 border-b-0 border-t-2 md:border-t-0 border-primary-500 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('attachments')}
          >
            Attachments
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'details' && (
          <div className="space-y-6 select-text cursor-default">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Service Information
              </h3>
              <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Service Name
                  </label>
                  <p className="mt-1">{service.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Price
                  </label>
                  <p className="mt-1">₱{service.price?.toLocaleString()}</p>
                  {service.furkredit_price && (
                    <p className="text-sm text-gray-600 font-bold">{service.furkredit_price.toLocaleString()} Furkredits</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Category
                  </label>
                  <p className="mt-1">{service.service_category_name}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="mt-1">{service.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Service Attachments</h3>
              <span className="text-sm text-gray-500">
                {service.attachments?.length > 0 ? 
                  `${service.attachments.length} attachments uploaded` : 
                  'No attachments uploaded'}
              </span>
            </div>
            {service.attachments && service.attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {service.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 hover:shadow-md transition-shadow"
                  >
                    <img
                      src={attachment}
                      alt={`${service.name} attachment ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => window.open(attachment, '_blank')}
                        className="p-2 bg-white rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                        title="Open attachment in new tab"
                      >
                        <ExternalLink size={16} className="text-gray-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                <ImageIcon size={48} />
                <span className="text-sm mt-2">No attachments uploaded</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Service"
        message={`Are you sure you want to delete "${service.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDelete();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default ServiceDetails;