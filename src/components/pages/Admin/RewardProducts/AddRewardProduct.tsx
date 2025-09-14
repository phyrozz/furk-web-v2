import React, { useState } from "react";
import { http } from "../../../../utils/http";
import { motion } from "framer-motion";
import Button from "../../../common/Button";
import Input from "../../../common/Input";
import { Plus } from "lucide-react";
import { S3UploadService } from "../../../../services/s3-upload/s3-upload-service";
import FileUploadField, { UploadedFile } from "../../../common/FileUploadField";

interface AddRewardProductFormProps {
  onSuccess: () => void;
  onCancel: () => void;      // go back without saving
}

const AddRewardProductForm: React.FC<AddRewardProductFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    sponsor_name: '',
    product_name: '',
    description: '',
    required_furkoins: 0,
    stock: 0,
  });

  const [productImages, setProductImages] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (productImages.length === 0) {
      setError("Please upload at least one product image");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Convert number fields to number type before submitting
      const submissionData = {
        ...formData,
        required_furkoins: Number(formData.required_furkoins),
        stock: Number(formData.stock),
      };
      
      // Create reward product first to get the ID
      const response: any = await http.post("/admin-reward-products/add", submissionData);
      const productId = response.data.id;

      // Upload images to S3 using product ID in the path
      const s3Service = new S3UploadService();

      for (const uploadedFile of productImages) {
        const fileName = s3Service.generateUniqueFileName(uploadedFile.file.name);
        await s3Service.uploadFile(
          uploadedFile.file, 
          `reward-products/${productId}/${fileName}`
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create reward product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-xl font-semibold mb-4">Add New Reward Product</h2>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Images */}
        <FileUploadField
          label="Product Images"
          required
          accept="image/*"
          maxFiles={5}
          maxSizeMB={5}
          files={productImages}
          onFilesChange={setProductImages}
          helperText="Upload up to 5 images (max 5MB each)"
        />

        {/* Sponsor Name */}
        <div>
          <label htmlFor="sponsor_name" className="block text-sm font-medium text-gray-700 mb-1">
            Business Name
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="sponsor_name"
            name="sponsor_name"
            maxLength={255}
            value={formData.sponsor_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Product Name */}
        <div>
          <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="product_name"
            name="product_name"
            maxLength={255}
            value={formData.product_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="description"
            name="description"
            maxLength={1000}
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Required Furkoins */}
        <div>
          <label htmlFor="required_furkoins" className="block text-sm font-medium text-gray-700 mb-1">
            Required Furkoins
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="required_furkoins"
            name="required_furkoins"
            type="number"
            min="0"
            value={formData.required_furkoins}
            onChange={handleChange}
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
            Stock
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={<Plus />}>Add</Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddRewardProductForm;
