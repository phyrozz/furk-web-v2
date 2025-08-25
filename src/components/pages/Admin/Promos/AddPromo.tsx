import React, { useState } from "react";
import { http } from "../../../../utils/http";
import { motion } from "framer-motion";
import Button from "../../../common/Button";
import Select from "../../../common/Select";
import Input from "../../../common/Input";
import DateInput from "../../../common/DateInput";

interface AddPromoFormProps {
  onSuccess: () => void;
  onCancel: () => void;      // go back without saving
}

const AddPromoForm: React.FC<AddPromoFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percent",
    discount_value: "0",
    usage_limit: "0",
    per_user_limit: "0",
    start_date: "",
    end_date: "",
    scope: 'admin',
    merchant_id: null
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
      // Convert number fields to number type before submitting
      const submissionData = {
        ...formData,
        discount_value: Number(formData.discount_value),
        usage_limit: Number(formData.usage_limit),
        per_user_limit: Number(formData.per_user_limit)
      };
      
      await http.post("/coupon/add", submissionData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create promo");
    } finally {
      setLoading(false);
    }
  };

  const discountTypeOptions = [
    { value: 'percent', label: 'Percent (%)' },
    { value: 'fixed', label: 'Fixed' },
    { value: 'furkredit_cashback', label: 'Furkredit Cashback' },
    { value: 'discount_furkoin', label: 'Furkoin Discount' },
    { value: 'earn_furkredit', label: 'Furkredit Cashback (%)' },
    { value: 'ean_furkoin', label: 'Earn Furkoins' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-xl font-semibold mb-4">Create New Promo</h2>

      {error && (
        <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code */}
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Code
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="code"
            name="code"
            maxLength={50}
            value={formData.code}
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
            maxLength={100}
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Discount Type & Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="discount_type" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type
              <span className="text-red-500">*</span>
            </label>
            <Select
              options={discountTypeOptions}
              value={discountTypeOptions.find(opt => opt.value === formData.discount_type) || null}
              onChange={(option) => setFormData(prev => ({ ...prev, discount_type: option?.value || 'percent' }))}
              getOptionLabel={(option) => option.label}
              placeholder="Select type"
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="discount_value" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value
              <span className="text-red-500">*</span>
            </label>
            <Input
              id="discount_value"
              name="discount_value"
              type="number"
              min="0"
              value={formData.discount_value}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
              <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.start_date ? new Date(formData.start_date) : null}
              onChange={(date) => {
                setFormData(prev => ({
                  ...prev,
                  start_date: date ? date.toISOString().split('T')[0] : ''
                }));
              }}
              placeholder="Select start date..."
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
              <span className="text-red-500">*</span>
            </label>
            <DateInput
              value={formData.end_date ? new Date(formData.end_date) : null}
              onChange={(date) => {
                setFormData(prev => ({
                  ...prev,
                  end_date: date ? date.toISOString().split('T')[0] : ''
                }));
              }}
              placeholder="Select end date..."
            />
          </div>
        </div>

        <div>
          <label htmlFor="usage_limit" className="block text-sm font-medium text-gray-700 mb-1">
            Usage Limit
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="usage_limit"
            name="usage_limit"
            type="number"
            max={999999999}
            min={0}
            step={1}
            value={formData.usage_limit}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="per_user_limit" className="block text-sm font-medium text-gray-700 mb-1">
            Per User Limit
            <span className="text-red-500">*</span>
          </label>
          <Input
            id="per_user_limit"
            name="per_user_limit"
            type="number"
            max={999999999}
            min={0}
            step={1}
            value={formData.per_user_limit}
            onChange={handleChange}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>Create Promo</Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AddPromoForm;
