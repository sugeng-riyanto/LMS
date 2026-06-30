import type { Grade } from "../lib/utils/constants"

export interface AgentStatus {
  execution_id: string
  agent_name: string
  grade: Grade
  week_number: number
  status: "started" | "running" | "completed" | "failed"
  input_data?: Record<string, unknown>
  output_data?: Record<string, unknown>
  error_message?: string
  execution_time_ms?: number
  tokens_used?: number
  created_at: string
}

export interface AgentExecution {
  id: string
  grade: number
  week_number: number
  execution_id: string
  package_type: "normal" | "exam" | "blackout" | "tryout" | "mock_test" | "offsite"
  sub_agents: AgentStatus[]
  started_at: string
  completed_at?: string
}

export interface LessonPlanPhase {
  phase: string
  minutes: number
  activity: string
  hook_question?: string
  mythbuster_or_analogy?: string
  group_rule?: string
  differentiation?: {
    support: string
    challenge: string
  }
  phenomenon?: string
  cer_template?: {
    claim: string
    evidence: string
    reasoning: string
  }
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
  type: string
  bloom: string
  question: string
  mark_scheme?: string
  peer_grade?: boolean
  intentional_error?: string
  solution_steps?: string[]
  derivation_method?: string
  exam_source?: string
  phenomenon?: string
  model_answer?: {
    claim: string
    evidence: string
    reasoning: string
  }
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
    duration_minutes: number
    source: string
  }
  interactive_simulation: {
    title: string
    url: string
    instructions: string
  }
  guided_notes: {
    title: string
    key_concepts: string[]
    fill_in_blanks: Array<{ prompt: string; answer: string }>
  }
  entry_ticket_quiz: Array<{
    question: string
    options: string[]
    correct: string
    explanation: string
  }>
}

export interface LabEquipment {
  item: string
  quantity: number
  status: "available" | "broken" | "need_order"
}

export interface LabLogistics {
  lab_required: boolean
  equipment_list: LabEquipment[]
  setup_instructions: string
  safety_notes: string[]
  lab_technician_message: string
}

export interface BroadcastMessage {
  wa_message: string
  lms_post: {
    title: string
    body: string
    attachments: string[]
    deadline: string
  }
  parent_message: string
}

export interface AgentInput {
  topic: string
  grade: number
  week_number: number
  academic_year: string
  calendar_status: string
  previous_misconceptions: string[]
  syllabus_ref: string
  exam_type?: string
}

export type AgentName = "LessonPlanAgent" | "WorksheetAgent" | "FlippedCuratorAgent" | "LogisticsAgent" | "BroadcastAgent"
