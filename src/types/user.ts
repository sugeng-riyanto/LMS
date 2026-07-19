export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'teacher' | 'lab_assistant' | 'student' | 'principal';
  avatar_url?: string;
  grade_assigned?: number | null;
  class_id?: string | null;
  phone_number?: string | null;
  is_active?: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}