export interface AgentInput {
  topic: string
  grade: number
  week_number: number
  academic_year: string
  calendar_status: "normal" | "holiday" | "exam" | "tryout" | "mock_test" | "offsite" | "blackout" | "pd_day"
  previous_misconceptions: string[]
  syllabus_ref: string
  exam_type: "none" | "quiz" | "midterm" | "final" | "tryout" | "mock_test"
}

export interface LessonPlanPhase {
  phase: string
  minutes: number
  activity: string
  hook_question?: string
  mythbuster_or_analogy?: string
  group_rule?: string
  differentiation?: string
  phenomenon?: string
  cer_template?: string
  reflection_prompt?: string
  peer_grading_instruction?: string
}

export interface LessonPlan {
  title: string
  grade: number
  duration_minutes: number
  phases: LessonPlanPhase[]
}

export interface WorksheetQuestion {
  id: string
  type: "multiple_choice" | "short_answer" | "long_answer" | "derivation" | "experimental_design"
  bloom: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create"
  question: string
  mark_scheme: string
  peer_grade?: boolean
  intentional_error?: string
  solution_steps?: string[]
  derivation_method?: string
  exam_source?: string
  phenomenon?: string
  model_answer?: string
  options?: string[]
  correct?: string
  explanation?: string
}

export interface WorksheetLevel {
  level: number
  name: string
  minutes: number
  questions: WorksheetQuestion[]
}

export interface Worksheet {
  title: string
  levels: WorksheetLevel[]
}

export interface PreClassMaterial {
  video_resource: {
    title: string
    url: string
    source: string
    duration_minutes: number
    key_concepts: string[]
    watch_guide: string
  }
  interactive_simulation: {
    title: string
    url: string
    platform: string
    instructions: string
    inquiry_questions: string[]
  }
  guided_notes: {
    title: string
    fill_in_blanks: { prompt: string; answer: string }[]
    completed_example: string
  }
  entry_ticket_quiz: {
    questions: {
      question: string
      options: string[]
      correct: number
      explanation: string
    }[]
    passing_score: number
  }
}

export interface LabEquipment {
  item: string
  quantity: number
  status: "available" | "limited" | "needs_order" | "out_of_stock"
}

export interface LabLogistics {
  lab_required: boolean
  equipment_list: LabEquipment[]
  setup_instructions: string[]
  safety_notes: string[]
  lab_technician_message: string
}

export interface BroadcastMessage {
  wa_message: string
  lms_post: {
    title: string
    body: string
    attachments?: { name: string; url: string }[]
    deadline?: string
  }
  parent_message: string
}

export type AgentName = "lesson_plan" | "worksheet" | "flipped_curator" | "logistics" | "broadcast"

export interface WeeklyPackage {
  academic_year: string
  grade: number
  week_number: number
  topic: string
  calendar_status: string
  lesson_plan: LessonPlan
  worksheet: Worksheet
  pre_class: PreClassMaterial
  lab_logistics: LabLogistics
  broadcast: BroadcastMessage
  answer_keys: AnswerKey[]
  generated_at: string
  agent_version: string
}

export interface AnswerKey {
  question: string
  answer: string
  explanation: string
}

export interface CalendarEvent {
  id?: string
  title: string
  date: string
  type: "normal" | "holiday" | "exam" | "tryout" | "mock_test" | "offsite" | "blackout" | "pd_day"
  description?: string
  grade?: number
}
