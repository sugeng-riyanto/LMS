export interface WeeklyPackage {
  id: string;
  title?: string;
  description?: string;
  academic_year: string;
  grade: number;
  week_number: number;
  week?: number;
  subject?: string;
  topic?: string;
  syllabus_ref?: string;
  calendar_status?: string;
  effective_days?: number;
  lesson_plan?: unknown;
  worksheet?: unknown;
  pre_class?: unknown;
  lab_logistics?: unknown;
  answer_keys?: unknown;
  wa_blast?: string;
  status: 'draft' | 'pending_review' | 'approved' | 'published' | 'archived';
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}
