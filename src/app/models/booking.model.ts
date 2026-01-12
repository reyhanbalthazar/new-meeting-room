export interface Participant {
  id: number;
  email: string;
  name: string;
  status: string;
}

export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  date: string; // ISO date string
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  pic: string;
  email: string;
  topic: string;
  status: string;
  participants: Participant[]; // Array of participants
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

export interface BookingGroup {
  month: string;
  dates: DateGroup[];
}

export interface DateGroup {
  date: string; // YYYY-MM-DD format
  schedules: Booking[];
}