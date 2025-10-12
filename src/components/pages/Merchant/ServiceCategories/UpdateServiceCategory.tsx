import React, { useState } from "react";
import { http } from "../../../../utils/http";
import { motion } from "framer-motion";
import Button from "../../../common/Button";
import { Save } from "lucide-react";
import { ServiceCategory } from "../../../../models/service-category";
import Autocomplete from "../../../common/Autocomplete";

interface UpdateServiceCategoryFormProps {
  category: ServiceCategory;
  onSuccess: (updatedFields: Partial<ServiceCategory>) => void;
  onCancel: () => void;
}

const LIMIT = 20;

const UpdateServiceCategoryForm: React.FC<UpdateServiceCategoryFormProps> = ({ 
  category, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    service_group: {
      id: category.service_group_id || 0,
      name: category.service_group_name || '',
    },
    name: category.name,
    description: category.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Autocomplete state for service groups
  const [serviceGroups, setServiceGroups] = useState<any[]>([]);
  const [serviceGroupKeyword, setServiceGroupKeyword] = useState('');
  const [serviceGroupOffset, setServiceGroupOffset] = useState(0);
  const [hasMoreServiceGroups, setHasMoreServiceGroups] = useState(true);
  const [isLoadingServiceGroups, setIsLoadingServiceGroups] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await http.post(`/service-categories/update/${category.id}`, {
        service_group_id: formData.service_group.id || undefined,
        description: formData.description,
      });
      onSuccess({
        service_group_name: formData.service_group.name,
        service_group_id: formData.service_group.id || undefined,
        name: formData.name,
        description: formData.description,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update service category');
      console.error('Error updating service category:', err);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete handlers
  const handleServiceGroupSearch = async (keyword: string) => {
    setIsLoadingServiceGroups(true);
    try {
      const response = await http.post<{ data: any[] }>('/merchant-service/list-service-groups', { limit: LIMIT, offset: 0, keyword });
      setServiceGroups(response.data);
      setHasMoreServiceGroups(response.data.length === LIMIT);
      setServiceGroupKeyword(keyword);
      setServiceGroupOffset(0);
    } catch (error) {
      console.error('Error searching service groups:', error);
    } finally {
      setIsLoadingServiceGroups(false);
    }
  };

  const handleLoadMoreServiceGroups = async () => {
    if (isLoadingServiceGroups) return;
    setIsLoadingServiceGroups(true);
    try {
      const response = await http.post<{ data: any[] }>('/merchant-service/list-service-groups', { limit: LIMIT, offset: serviceGroupOffset + LIMIT, keyword: serviceGroupKeyword });
      setServiceGroups(prev => [...prev, ...response.data]);
      setHasMoreServiceGroups(response.data.length === LIMIT);
      setServiceGroupOffset(prev => prev + LIMIT);
    } catch (error) {
      console.error('Error loading more service groups:', error);
    } finally {
      setIsLoadingServiceGroups(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">Edit Service Category</h2>
        <p className="text-sm text-gray-500 mt-1">
          Update the details for this service category
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="service_group_id" className="block text-sm font-medium text-gray-700 mb-1">
            Service Group
          </label>
          <Autocomplete
            options={serviceGroups}
            value={formData.service_group}
            onChange={(option) => setFormData({ ...formData, service_group: option || { id: 0, name: '' } })}
            getOptionLabel={(option) => option.name}
            placeholder="Search for a service group..."
            isLoading={isLoadingServiceGroups}
            onSearch={handleServiceGroupSearch}
            onLoadMore={handleLoadMoreServiceGroups}
            hasMore={hasMoreServiceGroups}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Enter category description"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <>
                <span className="mr-2">Saving...</span>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              </>
            ) : (
              <>
                <Save size={18} className="mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UpdateServiceCategoryForm;