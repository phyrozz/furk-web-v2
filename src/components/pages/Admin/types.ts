export interface MerchantApplication {
  id: number;
  merchant_id: number;
  business_name: string;
  merchant_type: 'BUSINESS' | 'FREELANCE';
  affiliate_code?: string | null;
  status: 'pending' | 'suspended' | 'rejected' | 'verified' | 'unverified';
  business_types: BusinessType[] | [];
  created_at: string;
  updated_at: string;
  notes?: string;
  fee_percent?: number;
}

export interface AffiliateApplication {
  id: number;
  application_id: number;
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
  notes?: string;
  fee_percent?: number;
  referred_merchants?: ReferredMerchant[];
}

interface BusinessType {
  id: number;
  name: string;
  description: string;
}

export interface ReferredMerchant {
  merchant_id: number;
  business_name: string;
  merchant_type: 'BUSINESS' | 'FREELANCE';
  application_status: 'pending' | 'verified' | 'unverified' | 'rejected' | 'suspended';
  joined_at: string;
}
