export interface RewardProduct {
  id: number;
  sponsor_name: string;
  product_name: string;
  description: string;
  required_furkoins: number;
  stock: number;
  is_active: boolean;
  attachments: string[];
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
};