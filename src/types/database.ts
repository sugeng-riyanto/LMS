export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: "super_admin" | "teacher" | "lab_assistant" | "student"
          grade_assigned: number | null
          avatar_url: string | null
          phone_number: string | null
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: "super_admin" | "teacher" | "lab_assistant" | "student"
          grade_assigned?: number | null
          avatar_url?: string | null
          phone_number?: string | null
          is_active?: boolean
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: "super_admin" | "teacher" | "lab_assistant" | "student"
          grade_assigned?: number | null
          avatar_url?: string | null
          phone_number?: string | null
          is_active?: boolean
          last_login_at?: string | null
        }
      }
      academic_calendars: {
        Row: {
          id: string
          academic_year: string
          semester: number
          month: number
          week_number: number
          start_date: string
          end_date: string
          effective_days: number
          event_name: string | null
          event_type: "normal" | "holiday" | "exam" | "tryout" | "mock_test" | "offsite" | "blackout" | "pd_day"
          affected_grades: number[]
          is_holiday: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academic_year: string
          semester: number
          month: number
          week_number: number
          start_date: string
          end_date: string
          effective_days?: number
          event_name?: string | null
          event_type?: "normal" | "holiday" | "exam" | "tryout" | "mock_test" | "offsite" | "blackout" | "pd_day"
          affected_grades?: number[]
          is_holiday?: boolean
          notes?: string | null
        }
        Update: {
          id?: string
          academic_year?: string
          semester?: number
          month?: number
          week_number?: number
          start_date?: string
          end_date?: string
          effective_days?: number
          event_name?: string | null
          event_type?: "normal" | "holiday" | "exam" | "tryout" | "mock_test" | "offsite" | "blackout" | "pd_day"
          affected_grades?: number[]
          is_holiday?: boolean
          notes?: string | null
        }
      }
      weekly_packages: {
        Row: {
          id: string
          academic_year: string
          grade: number
          week_number: number
          semester: number
          date_range_start: string | null
          date_range_end: string | null
          topic: string | null
          syllabus_ref: string | null
          calendar_status: string
          effective_days: number
          lesson_plan: Json | null
          worksheet: Json | null
          pre_class: Json | null
          lab_logistics: Json | null
          answer_keys: Json | null
          wa_blast: string | null
          status: "draft" | "pending_review" | "approved" | "published" | "archived"
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          academic_year: string
          grade: number
          week_number: number
          semester?: number
          date_range_start?: string | null
          date_range_end?: string | null
          topic?: string | null
          syllabus_ref?: string | null
          calendar_status?: string
          effective_days?: number
          lesson_plan?: Json | null
          worksheet?: Json | null
          pre_class?: Json | null
          lab_logistics?: Json | null
          answer_keys?: Json | null
          wa_blast?: string | null
          status?: "draft" | "pending_review" | "approved" | "published" | "archived"
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          academic_year?: string
          grade?: number
          week_number?: number
          semester?: number
          date_range_start?: string | null
          date_range_end?: string | null
          topic?: string | null
          syllabus_ref?: string | null
          calendar_status?: string
          effective_days?: number
          lesson_plan?: Json | null
          worksheet?: Json | null
          pre_class?: Json | null
          lab_logistics?: Json | null
          answer_keys?: Json | null
          wa_blast?: string | null
          status?: "draft" | "pending_review" | "approved" | "published" | "archived"
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          published_at?: string | null
        }
      }
      class_memory: {
        Row: {
          id: string
          academic_year: string
          grade: number
          week_number: number
          topic_taught: string | null
          misconceptions: Json
          average_classwork_score: number | null
          students_struggling: Json
          students_advanced: Json
          lab_equipment_status: Json
          notes_for_next_week: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          academic_year: string
          grade: number
          week_number: number
          topic_taught?: string | null
          misconceptions?: Json
          average_classwork_score?: number | null
          students_struggling?: Json
          students_advanced?: Json
          lab_equipment_status?: Json
          notes_for_next_week?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          academic_year?: string
          grade?: number
          week_number?: number
          topic_taught?: string | null
          misconceptions?: Json
          average_classwork_score?: number | null
          students_struggling?: Json
          students_advanced?: Json
          lab_equipment_status?: Json
          notes_for_next_week?: string | null
          created_by?: string | null
        }
      }
      lab_inventory: {
        Row: {
          id: string
          item_name: string
          category: string | null
          total_quantity: number
          available_quantity: number
          broken_quantity: number
          location: string | null
          last_restocked_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_name: string
          category?: string | null
          total_quantity?: number
          available_quantity?: number
          broken_quantity?: number
          location?: string | null
          last_restocked_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          item_name?: string
          category?: string | null
          total_quantity?: number
          available_quantity?: number
          broken_quantity?: number
          location?: string | null
          last_restocked_at?: string | null
          notes?: string | null
        }
      }
      mistake_journals: {
        Row: {
          id: string
          student_id: string
          grade: number
          entry_date: string
          topic: string
          mistake_description: string
          root_cause: string | null
          correct_approach: string | null
          law_or_principle: string | null
          related_package_id: string | null
          teacher_feedback: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          grade: number
          entry_date?: string
          topic: string
          mistake_description: string
          root_cause?: string | null
          correct_approach?: string | null
          law_or_principle?: string | null
          related_package_id?: string | null
          teacher_feedback?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          grade?: number
          entry_date?: string
          topic?: string
          mistake_description?: string
          root_cause?: string | null
          correct_approach?: string | null
          law_or_principle?: string | null
          related_package_id?: string | null
          teacher_feedback?: string | null
        }
      }
      knowledge_base: {
        Row: {
          id: string
          file_name: string
          chunk_index: number
          chunk_text: string
          embedding: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          file_name: string
          chunk_index: number
          chunk_text: string
          embedding?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          file_name?: string
          chunk_index?: number
          chunk_text?: string
          embedding?: string | null
          metadata?: Json
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
        }
      }
      entry_ticket_responses: {
        Row: {
          id: string
          student_id: string
          package_id: string | null
          question_id: string
          student_answer: string | null
          is_correct: boolean | null
          time_spent_seconds: number | null
          submitted_at: string
        }
        Insert: {
          id?: string
          student_id: string
          package_id?: string | null
          question_id: string
          student_answer?: string | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
        }
        Update: {
          id?: string
          student_id?: string
          package_id?: string | null
          question_id?: string
          student_answer?: string | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
        }
      }
      agent_logs: {
        Row: {
          id: string
          execution_id: string
          agent_name: string
          grade: number | null
          week_number: number | null
          status: "started" | "running" | "completed" | "failed"
          input_data: Json | null
          output_data: Json | null
          error_message: string | null
          execution_time_ms: number | null
          tokens_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          execution_id: string
          agent_name: string
          grade?: number | null
          week_number?: number | null
          status: "started" | "running" | "completed" | "failed"
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          tokens_used?: number | null
        }
        Update: {
          id?: string
          execution_id?: string
          agent_name?: string
          grade?: number | null
          week_number?: number | null
          status?: "started" | "running" | "completed" | "failed"
          input_data?: Json | null
          output_data?: Json | null
          error_message?: string | null
          execution_time_ms?: number | null
          tokens_used?: number | null
        }
      }
    }
    Views: {
      student_performance: {
        Row: {
          student_id: string | null
          full_name: string | null
          grade_assigned: number | null
          total_journal_entries: number | null
          entry_ticket_accuracy: number | null
          packages_attempted: number | null
        }
      }
      weekly_package_summary: {
        Row: {
          grade: number | null
          week_number: number | null
          total_packages: number | null
          published_count: number | null
          pending_count: number | null
          avg_effective_days: number | null
        }
      }
    }
    Functions: {
      match_knowledge_base: {
        Args: {
          query_embedding: string
          match_count?: number
          filter_metadata?: Json
        }
        Returns: Array<{
          id: string
          file_name: string
          chunk_text: string
          similarity: number
        }>
      }
    }
  }
}
