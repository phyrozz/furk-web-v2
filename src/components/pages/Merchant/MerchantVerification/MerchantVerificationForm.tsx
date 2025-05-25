import { useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import Button from '../../../common/Button';
import { S3UploadService } from '../../../../services/s3-upload/s3-upload-service';
import { MerchantVerificationService } from '../../../../services/merchant-verification/merchant-verification-service';
import { ToastService } from '../../../../services/toast/toast-service';
import { useNavigate } from 'react-router-dom';

interface UploadRequirement {
  id: string;
  name: string;
  type: 'document' | 'photo';
  description: string;
  required: boolean;
  maxSize: number; // in MB
  acceptedFormats: string[];
}

interface Service {
  id: string;
  name: string;
  description: string;
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const MerchantVerificationForm = () => {
  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  const navigate = useNavigate();

  const s3Service = new S3UploadService();
  const dataService = new MerchantVerificationService();

  const requirements: UploadRequirement[] = [
    {
      id: 'company_profile',
      name: 'Company Profile',
      type: 'document',
      description: 'Detailed information about your business',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.pdf', '.doc', '.docx'],
    },
    {
      id: 'dti_sec',
      name: 'DTI/SEC Registration',
      type: 'document',
      description: 'Certificate of Registration',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    },
    {
      id: 'bir_2303',
      name: 'BIR 2303/COR',
      type: 'document',
      description: 'BIR Certificate of Registration',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    },
    {
      id: 'mayors_permit',
      name: "Mayor's Permit",
      type: 'document',
      description: 'Valid business permit',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
    },
    {
      id: 'valid_id_1',
      name: 'Valid ID 1',
      type: 'document',
      description: 'Government-issued ID',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
    },
    {
      id: 'valid_id_2',
      name: 'Valid ID 2',
      type: 'document',
      description: 'Secondary government-issued ID',
      required: true,
      maxSize: 5,
      acceptedFormats: ['.jpg', '.jpeg', '.png', '.pdf'],
    },
    {
      id: 'exterior_photo',
      name: 'Exterior Photo',
      type: 'photo',
      description: 'Photo of establishment facade',
      required: true,
      maxSize: 10,
      acceptedFormats: ['.jpg', '.jpeg', '.png'],
    },
    {
      id: 'interior_photo_1',
      name: 'Interior Photo 1',
      type: 'photo',
      description: 'First interior photo',
      required: true,
      maxSize: 10,
      acceptedFormats: ['.jpg', '.jpeg', '.png'],
    },
    {
      id: 'interior_photo_2',
      name: 'Interior Photo 2',
      type: 'photo',
      description: 'Second interior photo',
      required: true,
      maxSize: 10,
      acceptedFormats: ['.jpg', '.jpeg', '.png'],
    },
  ];

  const handleFileChange = async (requirement: UploadRequirement, file: File) => {
    if (!file) return;

    // Validate file size
    if (file.size > requirement.maxSize * 1024 * 1024) {
      setUploads(prev => ({
        ...prev,
        [requirement.id]: {
          id: requirement.id,
          file,
          status: 'error',
          error: `File size exceeds ${requirement.maxSize}MB limit`,
        },
      }));
      return;
    }

    // Create preview for images
    let preview: string;
    if (requirement.type === 'photo' || file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setUploads(prev => ({
      ...prev,
      [requirement.id]: {
        id: requirement.id,
        file,
        preview,
        status: 'success',
      },
    }));
  };

  const removeFile = (requirementId: string) => {
    setUploads(prev => {
      const newUploads = { ...prev };
      if (newUploads[requirementId]?.preview) {
        URL.revokeObjectURL(newUploads[requirementId]!.preview!);
      }
      newUploads[requirementId] = null;
      return newUploads;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate all required files are uploaded
      const missingRequired = requirements
        .filter(req => req.required && !uploads[req.id])
        .map(req => req.name);

      if (missingRequired.length > 0) {
        throw new Error(`Missing required files: ${missingRequired.join(', ')}`);
      }

      // Insert application details to the database
      const submitResponse = await dataService.submitMerchantApplicationDetails();

      // Upload files to S3
      const uploadPromises = Object.values(uploads)
        .filter(upload => upload && upload.status === 'success')
        .map(upload => {
          const uniqueFileName = s3Service.generateUniqueFileName(upload!.file.name);
          const key = `merchant-verification/${submitResponse.data.application_id}/${uniqueFileName}`;
          return s3Service.uploadFile(upload!.file, key);
        });

      await Promise.all(uploadPromises);

      setUploads({});
      localStorage.setItem('merchantStatus', 'pending');
      navigate('/merchant/dashboard');
      ToastService.show('Application documents submitted successfully. We will send you an email once your application is verified or denied.');
    } catch (error: any) {
      ToastService.show('Failed to submit documents: ' + (error?.response?.data?.error !== undefined ? error?.response?.data?.error : error?.message));
      navigate('/merchant/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Merchant Verification
            </h1>
            <p className="text-gray-600 mt-2">
              Please submit the required documents to verify your business. We will review your application and get back to you within 2 business working days.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {requirement.name}
                      {requirement.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">{requirement.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Max size: {requirement.maxSize}MB
                    </p>
                  </div>

                  {uploads[requirement.id] ? (
                    <div className="relative">
                      {uploads[requirement.id]!.preview ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={uploads[requirement.id]!.preview}
                            alt={requirement.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                          <Check size={20} className="text-green-500 mr-2" />
                          <span className="text-sm text-gray-600">
                            {uploads[requirement.id]!.file.name}
                          </span>
                        </div>
                      )}
                      {uploads[requirement.id]!.status === 'error' && (
                        <p className="text-sm text-red-500 mt-2">
                          {uploads[requirement.id]!.error}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile(requirement.id)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <label className="block">
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors cursor-pointer">
                          <Upload
                            size={24}
                            className="text-gray-400 mb-2"
                          />
                          <span className="text-sm text-gray-500">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-gray-400 mt-1">
                            Accepted formats:{' '}
                            {requirement.acceptedFormats.join(', ')}
                          </span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept={requirement.acceptedFormats.join(',')}
                          onChange={(e) =>
                            handleFileChange(
                              requirement,
                              e.target.files?.[0]!
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setUploads({})}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MerchantVerificationForm;