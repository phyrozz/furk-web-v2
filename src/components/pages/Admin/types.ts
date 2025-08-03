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

export interface AffiliateApplication {
  id: number;
  code: string;
  address: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  username: string;
  phone_number: string;
  application_status: 'pending' | 'suspended' | 'rejected' | 'verified' | 'unverified';
  created_at: string;
  modified_at: string;
  attachments: any;
}

interface BusinessType {
  id: number;
  name: string;
  description: string;
}