import { useEffect, useState } from 'react';
import { Upload, X, Check } from 'lucide-react';
import Button from '../../../common/Button';
import { S3UploadService } from '../../../../services/s3-upload/s3-upload-service';
import { MerchantVerificationService } from '../../../../services/merchant-verification/merchant-verification-service';
import { ToastService } from '../../../../services/toast/toast-service';
import { useNavigate } from 'react-router-dom';
import MerchantNavbar from '../../../common/MerchantNavbar';
import MultipleAutocomplete from '../../../common/MultipleAutocomplete';
import { ServiceGroup, UploadRequirement, UploadedFile, freelanceMerchantRequirements, businessMerchantRequirements } from './types';
import FreelanceMerchantForm from './FreelanceMerchantForm';
import { LocationService } from '../../../../services/location/location-service';
import Autocomplete from '../../../common/Autocomplete';


const MerchantVerificationForm = () => {
  const [merchantType, setMerchantType] = useState<'business' | 'freelance'>('business');
  const [uploads, setUploads] = useState<Record<string, UploadedFile | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    serviceGroups: [{}],
    merchantType: 'BUSINESS',
    province: '',
    city: '',
    barangay: '',
    address: ''
  });
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [barangays, setBarangays] = useState<string[]>([]);
  const [serviceGroups, setServiceGroups] = useState<ServiceGroup[]>([]);
  const [selectedServiceGroups, setSelectedServiceGroups] = useState<ServiceGroup[]>([]);
  const [isLoadingServiceGroups, setIsLoadingServiceGroups] = useState(false);
  const [hasMoreServiceGroups, setHasMoreServiceGroups] = useState(false);
  const [serviceGroupKeyword, setServiceGroupKeyword] = useState('');
  const [serviceGroupOffset, setServiceGroupOffset] = useState(0);
  const limit = 20;

  const navigate = useNavigate();

  const s3Service = new S3UploadService();
  const dataService = new MerchantVerificationService();
  const locationService = new LocationService();

  const requirements = merchantType === 'freelance' ? freelanceMerchantRequirements : businessMerchantRequirements;

  useEffect(() => {
    // Load provinces on component mount
    setProvinces(locationService.getProvinces());
  }, []);

  useEffect(() => {
    // Load cities when province changes
    if (formData.province) {
      setCities(locationService.getCities(formData.province));
      setFormData(prev => ({ ...prev, city: '', barangay: '' }));
    } else {
      setCities([]);
    }
  }, [formData.province]);

  useEffect(() => {
    // Load barangays when city changes
    if (formData.province && formData.city) {
      setBarangays(locationService.getBarangays(formData.province, formData.city));
      setFormData(prev => ({ ...prev, barangay: '' }));
    } else {
      setBarangays([]);
    }
  }, [formData.city]);

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
      if (!selectedServiceGroups) {
        throw new Error('Please select at least one business type');
      }
      if (!formData.businessName.trim()) {
        throw new Error('Please enter a business name');
      }

      // Validate all required files are uploaded
      const missingRequired = requirements
        .filter(req => req.required && !uploads[req.id])
        .map(req => req.name);

      if (missingRequired.length > 0) {
        throw new Error(`Missing required files: ${missingRequired.join(', ')}`);
      }

      // Validate file sizes
      const oversizedFiles = Object.entries(uploads)
        .filter(([id, upload]) => {
          if (!upload) return false;
          const requirement = requirements.find(req => req.id === id);
          const isOversized = requirement && upload.file.size > requirement.maxSize * 1024 * 1024;
          console.log(`File ${id} size:`, upload.file.size, 'Max allowed:', requirement?.maxSize! * 1024 * 1024);
          return isOversized;
        })
        .map(([id]) => requirements.find(req => req.id === id)?.name);

      console.log('Oversized files:', oversizedFiles);

      if (oversizedFiles.length > 0) {
        throw new Error(`The following files exceed their size limits: ${oversizedFiles.join(', ')}`);
      }

      // Get selected service group ID and store it to formData
      formData.serviceGroups = selectedServiceGroups;

      console.log(formData);
      
      // Insert application details to the database
      const submitResponse = await dataService.submitMerchantApplicationDetails(formData);

      // Upload files to S3
      const uploadPromises = Object.values(uploads)
        .filter(upload => upload && upload.status === 'success')
        .map(upload => {
          const uniqueFileName = s3Service.generateUniqueFileName(upload!.file.name);
          const key = `merchant-verification/${submitResponse.data.application_id}/${upload?.id}/${uniqueFileName}`;
          return s3Service.uploadFile(upload!.file, key);
        });

      await Promise.all(uploadPromises);

      setUploads({});
      localStorage.setItem('merchantStatus', 'pending');
      navigate('/merchant/dashboard');
      ToastService.show('Application documents submitted successfully. We will send you an email once your application is verified or denied.');
    } catch (error: any) {
      ToastService.show(error?.response?.data?.error !== undefined ? error?.response?.data?.error : error?.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServiceGroupSearch = async (keyword: string) => {
    setIsLoadingServiceGroups(true);
    try {
      const response = await dataService.listServiceGroups(limit, 0, keyword);
      setServiceGroups(response.data);
      setHasMoreServiceGroups(response.data.length === limit);
      setServiceGroupKeyword(keyword);
      setServiceGroupOffset(0);
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setIsLoadingServiceGroups(false);
    }
  };

  const handleLoadMoreServiceGroups = async () => {
    if (isLoadingServiceGroups) return;
    
    setIsLoadingServiceGroups(true);
    try {
      const response = await dataService.listServiceGroups(limit, serviceGroupOffset, serviceGroupKeyword);
      setServiceGroups(prev => [...prev, ...response.data]);
      setHasMoreServiceGroups(response.data.length === limit);
      setServiceGroupOffset(prev => prev + limit);
    } catch (error) {
      console.error('Error loading more categories:', error);
    } finally {
      setIsLoadingServiceGroups(false);
    }
  };

  const locationFields = (
    <div className="space-y-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Province
          <span className="text-red-500">*</span>
        </label>
        <Autocomplete
          options={provinces.map(province => ({ value: province }))}
          value={formData.province ? { value: formData.province } : null}
          onChange={(value) => {
            const provinceValue = value && typeof value === 'object' && 'value' in value ? String(value.value) : '';
            setFormData({ ...formData, province: provinceValue });
          }}
          getOptionLabel={(option: { value: string }) => option.value}
          placeholder="Select province"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City/Municipality
          <span className="text-red-500">*</span>
        </label>
        <Autocomplete
          options={cities.map(city => ({ value: city }))}
          value={formData.city ? { value: formData.city } : null}
          onChange={(value) => {
            const cityValue = value && typeof value === 'object' && 'value' in value ? String(value.value) : '';
            setFormData({ ...formData, city: cityValue });
          }}
          getOptionLabel={(option: { value: string }) => option.value}
          placeholder="Select city"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barangay
          <span className="text-red-500">*</span>
        </label>
        <Autocomplete
          options={barangays.map(barangay => ({ value: barangay }))}
          value={formData.barangay ? { value: formData.barangay } : null}
          onChange={(value) => {
            const barangayValue = value && typeof value === 'object' && 'value' in value ? String(value.value) : '';
            setFormData({ ...formData, barangay: barangayValue });
          }}
          getOptionLabel={(option: { value: string }) => option.value}
          placeholder="Select barangay"
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Address
          <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="address"
          maxLength={512}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <MerchantNavbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              Merchant Verification
            </h1>
            <p className="text-gray-600 mt-2">
              Please submit the required documents to verify your business. We will review your application and get back to you within 2 - 3 business working days.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merchant Type
              <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="merchantType"
                  value="business"
                  checked={merchantType === 'business'}
                  onChange={(e) => setMerchantType(e.target.value as 'business' | 'freelance')}
                />
                <span className="ml-2">Business/Company</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  name="merchantType"
                  value="freelance"
                  checked={merchantType === 'freelance'}
                  onChange={(e) => setMerchantType(e.target.value as 'business' | 'freelance')}
                />
                <span className="ml-2">Freelance/Individual</span>
              </label>
            </div>
          </div>

          {merchantType === 'business' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  maxLength={255}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                />
              </div>

              {locationFields}

              <div className="space-y-2">
                <label htmlFor="serviceGroup" className="block text-sm font-medium text-gray-700">
                  Business Type
                  <span className="text-red-500">*</span>
                </label>
                <MultipleAutocomplete
                  options={serviceGroups}
                  values={selectedServiceGroups}
                  onChange={setSelectedServiceGroups}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
                  placeholder="Search items..."
                  onSearch={handleServiceGroupSearch}
                  isLoading={isLoadingServiceGroups}
                  maxSelections={5}
                  onLoadMore={handleLoadMoreServiceGroups}
                />
              </div>

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
          ) : (
            <FreelanceMerchantForm />
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantVerificationForm;