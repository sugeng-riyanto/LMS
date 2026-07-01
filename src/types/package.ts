export interface WeeklyPackage {
  id: string;
  academic_year: string;
  grade: number;
  week_number: number;
  semester?: number;
  date_range_start?: string | null;
  date_range_end?: string | null;
  topic?: string | null;
  title?: string;
  week?: number;
  syllabus_ref?: string | null;
  calendar_status?: string;
  effective_days?: number;
  lesson_plan?: unknown;
  worksheet?: unknown;
  pre_class?: unknown;
  lab_logistics?: unknown;
  answer_keys?: unknown;
  wa_blast?: string | null;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  created_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}