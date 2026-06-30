export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  type: 'lab_session' | 'deadline' | 'holiday' | 'meeting' | 'other';
  grade?: number;
  location?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
