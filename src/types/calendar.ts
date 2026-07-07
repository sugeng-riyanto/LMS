export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  grade?: number;
  start_date?: string;
  end_date?: string;
  effective_days?: number;
  event_name?: string;
  event_type?: string;
  affected_grades?: number[];
  is_holiday?: boolean;
  week_number?: number;
  month?: number;
  semester?: number;
  academic_year?: string;
  notes?: string;
  created_at?: string;
  personal?: boolean;
  created_by?: string | null;
}

export interface AcademicCalendarRow {
  id: string;
  academic_year: string;
  semester: number;
  month: number;
  week_number: number;
  start_date: string;
  end_date: string;
  effective_days: number;
  event_name: string | null;
  event_type: string;
  affected_grades: number[];
  is_holiday: boolean;
  notes: string | null;
  created_at: string;
}
