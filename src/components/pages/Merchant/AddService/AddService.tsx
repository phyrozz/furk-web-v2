import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../common/Button';
import { AddServiceService } from '../../../../services/add-service/add-service-service';
import Autocomplete from '../../../common/Autocomplete';
import { ToastService } from '../../../../services/toast/toast-service';
import { S3UploadService } from '../../../../services/s3-upload/s3-upload-service';
import MerchantNavbar from '../../../common/MerchantNavbar';
import FileUploadField, { UploadedFile } from '../../../common/FileUploadField';

// interface ServiceFormData {
//   category: string;
//   price: number;
// }

interface ServiceCategory {
  id: number;
  code: string;
  name: string;
}



const AddService = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<any>({
    name: '',
    category: '',
    description: '',
    price: 0,
    images: [],
  });
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const dataService = new AddServiceService();
  const s3Service = new S3UploadService();

  const handleSearch = async (keyword: string) => {
    setIsLoading(true);
    try {
      const response: any = await dataService.listServiceCategories(limit, 0, keyword);
      setCategories(response.data);
      setHasMore(response.data.length === limit);
      setKeyword(keyword);
      setOffset(0);
    } catch (error) {
      console.error('Error searching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response: any = await dataService.listServiceCategories(limit, offset, keyword);
      setCategories(prev => [...prev, ...response.data]);
      setHasMore(response.data.length === limit);
      setOffset(prev => prev + limit);
    } catch (error) {
      console.error('Error loading more categories:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const uploadImages = async (serviceId: string): Promise<string[]> => {
    const uploadPromises = uploadedImages.map(async (image) => {
      const uniqueFileName = s3Service.generateUniqueFileName(image.file.name);
      const key = `service-attachments/${serviceId}/${uniqueFileName}`;
      
      try {
        const url = await s3Service.uploadFile(image.file, key);
        return url;
      } catch (error) {
        throw new Error(`Failed to upload ${image.file.name}`);
      }
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const insertResponse: any = await dataService.insertService(formData);
      const serviceId = insertResponse.data.service_id;
      await uploadImages(serviceId);

      ToastService.show('Service added successfully')

      navigate(-1);
    } catch (error: any) {
      ToastService.show('Error adding service' + (error?.response?.data && ': ') + error?.response?.data?.error)
      console.error('Error adding service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };1

  return (
    <div className="min-h-screen bg-gray-50 pt-16 h-screen overflow-y-hidden flex flex-col cursor-default">
      <MerchantNavbar />
      <div className="container max-w-2xl p-8 mx-auto flex flex-col overflow-y-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-cursive font-bold text-gray-800">
            List New Service
          </h1>
          <p className="text-gray-600 mt-2">
            Add a new service to your business profile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Service Category
              <span className="text-red-500">*</span>
            </label>
            <Autocomplete
              options={categories}
              value={formData.category}
              onChange={(category) => setFormData({ ...formData, category })}
              getOptionLabel={(category) => category.name}
              placeholder="Search for a service category..."
              isLoading={isLoading}
              onSearch={handleSearch}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              maxLength={1024}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price (₱)
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              min="0"
              max="999999.99"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <FileUploadField
            label="Service Images"
            required
            accept="image/*"
            maxFiles={5}
            files={uploadedImages}
            onFilesChange={setUploadedImages}
            helperText="Upload up to 5 images (PNG, JPG, JPEG)"
          />

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/merchant/manage-services')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Service...' : 'Add Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddService;