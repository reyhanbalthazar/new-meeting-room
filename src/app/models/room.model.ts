export interface Room {
  id: number;
  name: string;
  capacity: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}