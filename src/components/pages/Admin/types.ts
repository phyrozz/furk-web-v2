export interface MerchantApplication {
  id: number;
  merchant_id: number;
  business_name: string;
  merchant_type: 'BUSINESS' | 'FREELANCE';
  status: 'pending' | 'suspended' | 'rejected' | 'verified' | 'unverified';
  business_types: BusinessType[] | [];
  created_at: string;
  updated_at: string;
}

interface BusinessType {
  id: number;
  name: string;
  description: string;
}