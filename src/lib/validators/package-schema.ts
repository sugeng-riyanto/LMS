import { z } from "zod"

const lessonPlanPhaseSchema = z.object({
  phase: z.string().min(1, "Phase name is required"),
  minutes: z.number().int().min(1).max(60),
  activity: z.string().min(1, "Activity description is required"),
  hook_question: z.string().optional(),
  mythbuster_or_analogy: z.string().optional(),
  group_rule: z.string().optional(),
  differentiation: z.string().optional(),
  phenomenon: z.string().optional(),
  cer_template: z.string().optional(),
  reflection_prompt: z.string().optional(),
  peer_grading_instruction: z.string().optional()
})

const lessonPlanSchema = z.object({
  title: z.string().min(1, "Lesson plan title is required"),
  grade: z.number().int().min(7).max(12),
  duration_minutes: z.number().int().min(1),
  phases: z.array(lessonPlanPhaseSchema).min(1, "At least one phase is required")
})

const worksheetQuestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["multiple_choice", "short_answer", "long_answer", "derivation", "experimental_design"]),
  bloom: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]),
  question: z.string().min(1, "Question text is required"),
  mark_scheme: z.string().min(1, "Mark scheme is required"),
  peer_grade: z.boolean().optional(),
  intentional_error: z.string().optional(),
  solution_steps: z.array(z.string()).optional(),
  derivation_method: z.string().optional(),
  exam_source: z.string().optional(),
  phenomenon: z.string().optional(),
  model_answer: z.string().optional(),
  options: z.array(z.string()).optional(),
  correct: z.string().optional(),
  explanation: z.string().optional()
})

const worksheetLevelSchema = z.object({
  level: z.number().int().min(1).max(3),
  name: z.string().min(1),
  minutes: z.number().int().min(1),
  questions: z.array(worksheetQuestionSchema).min(1, "At least one question required")
})

const worksheetSchema = z.object({
  title: z.string().min(1),
  levels: z.array(worksheetLevelSchema).min(1).max(3)
})

const preClassMaterialSchema = z.object({
  video_resource: z.object({
    title: z.string().min(1),
    url: z.string().url(),
    source: z.string().min(1),
    duration_minutes: z.number().min(1),
    key_concepts: z.array(z.string()),
    watch_guide: z.string()
  }),
  interactive_simulation: z.object({
    title: z.string().min(1),
    url: z.string().url(),
    platform: z.string().min(1),
    instructions: z.string().min(1),
    inquiry_questions: z.array(z.string())
  }),
  guided_notes: z.object({
    title: z.string().min(1),
    fill_in_blanks: z.array(z.object({
      prompt: z.string(),
      answer: z.string()
    })),
    completed_example: z.string()
  }),
  entry_ticket_quiz: z.object({
    questions: z.array(z.object({
      question: z.string().min(1),
      options: z.array(z.string()).min(2),
      correct: z.number().int().min(0),
      explanation: z.string()
    })).min(1),
    passing_score: z.number().int().min(0)
  })
})

const labEquipmentSchema = z.object({
  item: z.string().min(1),
  quantity: z.number().int().min(1),
  status: z.enum(["available", "limited", "needs_order", "out_of_stock"])
})

const labLogisticsSchema = z.object({
  lab_required: z.boolean(),
  equipment_list: z.array(labEquipmentSchema),
  setup_instructions: z.array(z.string()),
  safety_notes: z.array(z.string()),
  lab_technician_message: z.string()
})

const broadcastMessageSchema = z.object({
  wa_message: z.string().min(1),
  lms_post: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string()
    })).optional(),
    deadline: z.string().optional()
  }),
  parent_message: z.string().min(1)
})

export const weeklyPackageSchema = z.object({
  academic_year: z.string().regex(/^\d{4}-\d{4}$/, "Must be in format YYYY-YYYY"),
  grade: z.number().int().min(7).max(12),
  week_number: z.number().int().min(1).max(52),
  topic: z.string().min(1),
  calendar_status: z.enum([
    "normal", "holiday", "exam", "tryout",
    "mock_test", "offsite", "blackout", "pd_day"
  ]),
  lesson_plan: lessonPlanSchema,
  worksheet: worksheetSchema,
  pre_class: preClassMaterialSchema,
  lab_logistics: labLogisticsSchema,
  broadcast: broadcastMessageSchema,
  generated_at: z.string().datetime(),
  agent_version: z.string()
})

export type WeeklyPackageZod = z.infer<typeof weeklyPackageSchema>

export function validateWeeklyPackage(data: unknown) {
  const result = weeklyPackageSchema.safeParse(data)
  if (!result.success) {
    const errors = (result.error.issues as Array<{ path: (string | number)[]; message: string }>).map(e => ({
      path: e.path.join("."),
      message: e.message
    }))
    return { success: false as const, errors }
  }
  return { success: true as const, data: result.data }
}
