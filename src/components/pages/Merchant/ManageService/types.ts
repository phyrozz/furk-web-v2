export interface Service {
  id: string;
  service_category_id: string;
  service_category_name: string;
  name: string;
  description: string;
  price: number;
  furkredit_price: number;
  category: string;
  attachments: string[];
  payout_per_completion: boolean;
  requires_pet?: boolean;
}
