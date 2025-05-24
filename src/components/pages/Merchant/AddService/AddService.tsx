import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../common/Button';
import { AddServiceService } from '../../../../services/add-service/add-service-service';
import Autocomplete from '../../../common/Autocomplete';

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
    category: '',
    price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const dataService = new AddServiceService();

  const handleSearch = async (keyword: string) => {
    setIsLoading(true);
    try {
      const response = await dataService.listServiceCategories(limit, 0, keyword);
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
      const response = await dataService.listServiceCategories(limit, offset, keyword);
      setCategories(prev => [...prev, ...response.data]);
      setHasMore(response.data.length === limit);
      setOffset(prev => prev + limit);
    } catch (error) {
      console.error('Error loading more categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      
      console.log('Submitting service:', formData);
      navigate('/merchant/dashboard');
    } catch (error) {
      console.error('Error adding service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };1

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">
              List New Service
            </h1>
            <p className="text-gray-600 mt-2">
              Add a new service to your business profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-sm p-6">
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
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (₱)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/merchant/dashboard')}
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
    </div>
  );
};

export default AddService;