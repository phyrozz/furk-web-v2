export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  role_id: number;
  phone_number: string;
  created_by: string;
  created_at: string;
  modified_by: string;
  modified_at: string;
}