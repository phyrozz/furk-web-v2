export interface RewardTier {
  id: number;
  tier_level: number;
  name: string;
  description: string;
  required_furkredits: number;
  icon_key: string;
  color_code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RewardTierResponse {
  data: RewardTier[];
  total: number;
}