import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../../common/Button';
import Autocomplete from '../../../common/Autocomplete';
import { ToastService } from '../../../../services/toast/toast-service';
import MerchantNavbar from '../../../common/MerchantNavbar';
// import FileUploadField, { UploadedFile } from '../../../common/FileUploadField';
import Input from '../../../common/Input';
import Switch from '../../../common/Switch';
import { http } from '../../../../utils/http';
import PawLoading from '../../../common/PawLoading';
import { formatAmount } from '../../../../utils/currency-utils';

interface ServiceCategory {
  id: number;
  code: string;
  name: string;
}

const EditService = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    price: 0,
    duration: null,
    payout_per_completion: false,
    requires_pet: true,
    category: {
      id: 0,
      name: '',
    },
  });
  // const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  // const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (id) {
      http.get<any>(`/merchant-service/get/${id}`)
        .then(res => {
          const data = res.data;
          setFormData({
            name: data.name,
            category: {
              id: data.service_category_id,
              name: data.service_category_name,
            },
            description: data.description,
            price: data.price,
            duration: data.duration,
            payout_per_completion: data.payout_per_completion,
            requires_pet: data.requires_pet ?? true
          });
          setPageLoading(false);
        })
        .catch(() => ToastService.show('Failed to load service'));
    }
  }, [id]);

  // const handleSearch = async (keyword: string) => {
  //   setIsLoading(true);
  //   try {
  //     const response = await http.post<any>(`/merchant-service/list-service-categories`, {
  //       limit,
  //       offset: 0,
  //       keyword: keyword
  //     });
  //     setCategories(response.data);
  //     setHasMore(response.data.length === limit);
  //     setKeyword(keyword);
  //     setOffset(0);
  //   } catch (error) {
  //     console.error('Error searching categories:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleLoadMore = async () => {
  //   if (isLoading) return;
    
  //   setIsLoading(true);
  //   try {
  //     const response = await http.post<any>(`/merchant-service/list-service-categories`, {
  //       limit,
  //       offset: offset,
  //       keyword: keyword
  //     });
  //     setCategories(prev => [...prev, ...response.data]);
  //     setHasMore(response.data.length === limit);
  //     setOffset(prev => prev + limit);
  //   } catch (error) {
  //     console.error('Error loading more categories:', error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        service_category_id: formData.category.id,
        duration: formData.duration, // explicitly include duration even if null
        description: formData.description.trim(),
      };

      await http.post<any>(`/merchant-service/update/${id}`, payload);
      ToastService.show('Service updated successfully');
      navigate(-1);
    } catch (error: any) {
      ToastService.show('Error saving service' + (error?.response?.data && ': ') + error?.response?.data?.error);
      console.error('Error saving service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 md:pt-6 h-screen overflow-y-hidden flex flex-col cursor-default lg:pl-[var(--merchant-navbar-width,18rem)]">
      <MerchantNavbar />
      {pageLoading && <div className="flex justify-center items-center h-full">
        <PawLoading />
      </div>}
      {!pageLoading && (
      <div className="w-full max-w-2xl p-8 md:px-6 lg:px-8 flex flex-col overflow-y-hidden">
        <div className="mb-8">
          <h1 className="text-3xl font-cursive font-bold text-gray-800">
            {id ? 'Edit Service' : 'List New Service'}
          </h1>
          <p className="text-gray-600 mt-2">
            {id ? 'Update your service details' : 'Add a new service to your business profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-6 bg-white rounded-lg shadow-sm p-6 overflow-y-auto">
          <div>
            <Input 
              disabled
              label="Service Name"
              type="text"
              id="name"
              maxLength={255}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* <div>
            <label htmlFor="category" className="block text-sm font-bold text-gray-700 mb-1">
              Service Category
              <span className="text-red-500"> *</span>
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
          </div> */}

          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1">
              Description
              <span className="text-red-500"> *</span>
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
            <Input 
              label="Price (₱)"
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
            <p className="text-sm text-gray-600 font-bold">Furkredit: {formatAmount(formData.price ? formData.price * 0.0125 : 0)}</p>
          </div>
          <div>
            <Input 
              label="Duration"
              id="duration"
              type="number"
              min={0}
              max={999999}
              step={1}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              placeholder="Estimated service duration (in minutes)"
            />
          </div>
          <div className="flex gap-2 justify-start items-center">
            <Switch
              isOn={formData.payout_per_completion ? true : false}
              handleToggle={() => setFormData({ ...formData, payout_per_completion: !formData.payout_per_completion })}
            />
            <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 gap-1">    
              Enable payout per service completion
              <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex gap-2 justify-start items-center">
            <Switch
              isOn={formData.requires_pet ? true : false}
              handleToggle={() => setFormData({ ...formData, requires_pet: !formData.requires_pet })}
            />
            <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 gap-1">    
              Require pet for fulfillment
              <span className="text-red-500">*</span>
            </label>
          </div>

          <p className="text-sm text-gray-500">
            Disable this for services that should use the pet owner QR instead of a pet QR.
          </p>

          {/* <FileUploadField
            label="Service Images"
            required
            accept="image/*"
            maxFiles={5}
            files={uploadedImages}
            onFilesChange={setUploadedImages}
            helperText="Upload up to 5 images (PNG, JPG, JPEG)"
          /> */}

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
              {isSubmitting ? (id ? 'Updating...' : 'Adding...') : (id ? 'Update Service' : 'Add Service')}
            </Button>
          </div>
        </form>
      </div>
      )}
    </div>
  );
};

export default EditService;
