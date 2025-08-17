export interface Promo {
  id: number;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string;
  scope: string;
  merchant_id: number;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
};