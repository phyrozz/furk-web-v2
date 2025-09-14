import React, { useState } from "react";
import { motion } from "framer-motion";
import Button from "../../../common/Button";
import Input from "../../../common/Input";
import { Save } from "lucide-react";
import { RewardProduct } from "../../../../models/reward-product";
import { http } from "../../../../utils/http";

interface UpdateRewardProductFormProps {
  product: RewardProduct;
  onSuccess: (updatedFields: Partial<RewardProduct>) => void;
  onCancel: () => void;
}

const UpdateRewardProductForm: React.FC<UpdateRewardProductFormProps> = ({ product, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    description: product.description,
    required_furkoins: product.required_furkoins,
    stock: product.stock,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const submissionData = {
        ...formData,
        required_furkoins: Number(formData.required_furkoins),
        stock: Number(formData.stock),
      };
      
      await http.put(`/admin-reward-products/update/${product.id}`, submissionData);
      onSuccess(submissionData); // pass updated fields back
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update reward product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl font-semibold mb-4">Update Reward Product</h2>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={<Save />}>
            Save Changes
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UpdateRewardProductForm;
