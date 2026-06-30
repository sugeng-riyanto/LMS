export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'teacher' | 'lab_assistant' | 'student';
  avatar_url?: string;
  grade?: number;
  created_at: string;
  updated_at: string;
}
