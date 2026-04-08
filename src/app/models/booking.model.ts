export interface Participant {
  id: number;
  email: string;
  name: string;
  status: string;
}

export enum MeetingCategory {
  Internal = 'Internal',
  External = 'External',
  Executive = 'Executive',
  Interview = 'Interview',
  Training = 'Training',
  Presentation = 'Presentation',
  Personal = 'Personal'
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
  meeting_category: MeetingCategory;
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