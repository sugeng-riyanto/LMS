export interface WeeklyPackage {
  id: string;
  title: string;
  description: string;
  grade: number;
  week: number;
  subject: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'archived';
  content: Record<string, unknown>;
  created_by: string;
  approved_by?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
}
