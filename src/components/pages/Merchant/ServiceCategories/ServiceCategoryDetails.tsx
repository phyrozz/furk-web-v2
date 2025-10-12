import React, { useState } from 'react';
import { ServiceCategory } from '../../../../models/service-category';
import DateUtils from '../../../../utils/date-utils';
import { Edit2, Trash2 } from 'lucide-react';
import Button from '../../../common/Button';
import UpdateServiceCategoryForm from './UpdateServiceCategory';
import { http } from '../../../../utils/http';

interface Props {
  category: ServiceCategory | null;
  onUpdated?: (updated: ServiceCategory) => void;
  onDeleted?: () => void;
}

const ServiceCategoryDetails: React.FC<Props> = ({ category, onUpdated, onDeleted }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!category) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        Select a category to view details
      </div>
    );
  }

  const handleEditSuccess = (updatedFields: Partial<ServiceCategory>) => {
    setIsEditing(false);
    
    if (!category) return;
    const updated: ServiceCategory = {
      ...category,
      ...updatedFields,
      modified_at: new Date().toISOString()
    };
    onUpdated?.(updated);
  };

  const handleDelete = async () => {
    if (!category) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await http.delete(`/service-categories/delete/${category.id}`);
      onDeleted?.();
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {isEditing ? (
        <UpdateServiceCategoryForm
          category={category}
          onSuccess={handleEditSuccess}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div>
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{category.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Code: {category.code}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center"
              >
                <Edit2 size={16} className="mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                color="red"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center"
              >
                {isDeleting ? (
                  <>
                    <span className="mr-1">Deleting...</span>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-1" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>

          {deleteError && (
            <div className="p-4 m-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {deleteError}
            </div>
          )}

          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {category.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Service Group</p>
                <p className="text-gray-900 break-words">{category.service_group_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category ID</p>
                <p className="text-gray-900 break-words">{category.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-gray-900 break-words">
                  {DateUtils.formatTimestampString(category.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Modified At</p>
                <p className="text-gray-900 break-words">
                  {DateUtils.formatTimestampString(category.modified_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCategoryDetails;