export interface BookingPayouts {
  id: number;
  booking_id: number;
  merchant_id: number;
  service: {
    id: number;
    name: string;
    description: string;
    status: string;
  },
  amount: number;
  earning_date: string;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
}