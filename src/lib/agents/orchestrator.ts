import type { AgentInput, WeeklyPackage } from "./agent-types"
import { generateLessonPlan } from "./lesson-plan-agent"
import { generateWorksheet } from "./worksheet-agent"
import { generatePreClass } from "./flipped-curator"
import { generateLogistics } from "./logistics-agent"
import { generateBroadcast } from "./broadcast-agent"
import { generateAnswerKeys } from "./answer-keys-agent"
import { callLLM, getActiveProvider } from "./call-llm"
import { getCurrentWeek, getAcademicYear } from "../utils/week-calculator"

const TOPIC_MAP: Record<number, Record<number, string>> = {
  7: {
    1: "Forces", 2: "Forces", 3: "Kinematics", 4: "Kinematics",
    5: "Kinematics", 6: "Forces", 7: "Forces", 8: "Forces",
    9: "Energy", 10: "Energy", 11: "Forces", 12: "Pressure",
    13: "Density", 14: "Thermal", 15: "Waves", 16: "Sound",
    17: "Light", 18: "Light", 19: "Electricity", 20: "Electricity",
    21: "Magnetism", 22: "Forces"
  },
  8: {
    1: "Kinematics", 2: "Kinematics", 3: "Forces", 4: "Forces",
    5: "Forces", 6: "Forces", 7: "Light", 8: "Light",
    9: "Light", 10: "Light", 11: "Magnetism", 12: "Forces",
    13: "Thermal", 14: "Energy", 15: "Magnetism", 16: "Pressure",
    17: "Magnetism", 18: "Magnetism", 19: "Forces", 20: "Light",
    21: "Forces", 22: "Forces"
  },
  9: {
    1: "Kinematics", 2: "Kinematics", 3: "Kinematics", 4: "Forces",
    5: "Forces", 6: "Forces", 7: "Energy", 8: "Energy",
    9: "Energy", 10: "Energy", 11: "Waves", 12: "Light",
    13: "Light", 14: "Sound", 15: "Waves", 16: "Electricity",
    17: "Electricity", 18: "Electricity", 19: "Magnetism", 20: "Magnetism",
    21: "Forces", 22: "Forces"
  },
  10: {
    1: "Kinematics", 2: "Kinematics", 3: "Forces", 4: "Forces",
    5: "Forces", 6: "Energy", 7: "Energy", 8: "Energy",
    9: "Thermal", 10: "Thermal", 11: "Waves", 12: "Waves",
    13: "Light", 14: "Light", 15: "Sound", 16: "Electricity",
    17: "Electricity", 18: "Magnetism", 19: "Magnetism", 20: "Forces",
    21: "Forces", 22: "Forces"
  },
  11: {
    1: "Forces", 2: "Kinematics", 3: "Forces", 4: "Pressure",
    5: "Energy", 6: "Forces", 7: "Waves", 8: "Waves",
    9: "Waves", 10: "Waves", 11: "Electricity", 12: "Electricity",
    13: "Electricity", 14: "Electricity", 15: "Forces", 16: "Forces",
    17: "Forces", 18: "Forces", 19: "Forces", 20: "Forces",
    21: "Forces", 22: "Forces"
  },
  12: {
    1: "Forces", 2: "Forces", 3: "Thermal", 4: "Thermal",
    5: "Waves", 6: "Waves", 7: "Electricity", 8: "Electricity",
    9: "Electricity", 10: "Magnetism", 11: "Magnetism", 12: "Magnetism",
    13: "Forces", 14: "Forces", 15: "Forces", 16: "Forces",
    17: "Forces", 18: "Forces", 19: "Pressure", 20: "Electricity",
    21: "Forces", 22: "Forces"
  }
}

const MISCONCEPTIONS: Record<string, string[]> = {
  kinematics: [
    "Students often confuse displacement with distance",
    "Students believe negative acceleration always means deceleration",
    "Students think stationary objects have no forces acting on them",
    "Students struggle to distinguish between average and instantaneous velocity"
  ],
  forces: [
    "Students think a force is required to maintain motion",
    "Students believe action-reaction forces act on the same object",
    "Students think heavier objects fall faster"
  ],
  energy: [
    "Students think energy can be 'used up' or 'created'",
    "Students think energy only exists when an object is moving"
  ]
}

function getCalendarStatus(): { status: AgentInput["calendar_status"]; examType: AgentInput["exam_type"] } {
  const now = new Date()
  const week = getCurrentWeek(now)
  if (week >= 6 && week <= 8) return { status: "exam", examType: "midterm" }
  if (week >= 12 && week <= 14) return { status: "tryout", examType: "tryout" }
  if (week >= 20 && week <= 22) return { status: "exam", examType: "final" }
  if (week === 5 || week === 11 || week === 19) return { status: "mock_test", examType: "mock_test" }
  if (week % 7 === 0) return { status: "holiday", examType: "none" }
  return { status: "normal", examType: "none" }
}

function getSyllabusRef(grade: number): string {
  const refs: Record<number, string> = {
    7: "0893 Stage 7",
    8: "0893 Stage 8/9",
    9: "0625 (Half)",
    10: "0625 (Full)",
    11: "9702 AS",
    12: "9702 A2 + TKA"
  }
  return refs[grade] || "0625 (Full)"
}

function getMisconceptionsForTopic(grade: number, topic: string): string[] {
  const key = topic.toLowerCase()
  for (const [k, v] of Object.entries(MISCONCEPTIONS)) {
    if (key.includes(k)) return v
  }
  return [
    "Students may struggle with abstract concepts in this topic",
    "Students need help connecting concepts to everyday applications"
  ]
}

export async function orchestrateWeeklyGeneration(grade?: number): Promise<WeeklyPackage> {
  try {
    const now = new Date()
    const weekNumber = getCurrentWeek(now)
    const academicYear = getAcademicYear()
    const targetGrade = grade || 10
    const syllabusRef = getSyllabusRef(targetGrade)
    const { status, examType } = getCalendarStatus()

    const gradeTopics = TOPIC_MAP[targetGrade] || TOPIC_MAP[10]
    const topic = gradeTopics[weekNumber] || gradeTopics[1] || "Kinematics"

    const previousMisconceptions = getMisconceptionsForTopic(targetGrade, topic)

    const input: AgentInput = {
      topic,
      grade: targetGrade,
      week_number: weekNumber,
      academic_year: academicYear,
      calendar_status: status,
      previous_misconceptions: previousMisconceptions,
      syllabus_ref: syllabusRef,
      exam_type: examType
    }

    const activeProvider = await getActiveProvider()

    if (activeProvider) {
      try {
        const result = await generateWithLLM(input, activeProvider)
        if (result && validateLLMResult(result)) return result
      } catch (llmError) {
        console.warn("LLM generation failed, falling back to template agents:", llmError)
      }
    }

    const [lessonPlan, worksheet, preClass, logistics, broadcast, answerKeys] = await Promise.all([
      generateLessonPlan(input),
      generateWorksheet(input),
      generatePreClass(input),
      generateLogistics(input),
      generateBroadcast(input),
      generateAnswerKeys(input),
    ])

    return {
      academic_year: academicYear,
      grade: targetGrade,
      week_number: weekNumber,
      topic,
      calendar_status: status,
      lesson_plan: lessonPlan,
      worksheet,
      pre_class: preClass,
      lab_logistics: logistics,
      broadcast,
      answer_keys: answerKeys,
      generated_at: now.toISOString(),
      agent_version: "1.0.0"
    }
  } catch (error) {
    console.error("Orchestrator failed:", error)
    throw new Error(
      `Failed to generate weekly package: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

function validateLLMResult(result: WeeklyPackage): boolean {
  const lp = result.lesson_plan
  if (!lp || typeof lp !== "object" || !Array.isArray(lp.phases) || lp.phases.length < 2) return false
  const ws = result.worksheet
  if (!ws || typeof ws !== "object" || !Array.isArray(ws.levels)) return false
  const hasQuestions = ws.levels.some((l: { questions?: unknown[] }) => l.questions && l.questions.length > 0)
  if (!hasQuestions) return false
  const pc = result.pre_class
  if (!pc || typeof pc !== "object") return false
  const bc = result.broadcast
  if (!bc || typeof bc !== "object" || !bc.wa_message) return false
  const ak = result.answer_keys
  if (!Array.isArray(ak) || ak.length === 0) return false
  const nonEmpty = ak.filter((k: { answer?: string }) => k.answer).length
  if (nonEmpty === 0) return false
  return true
}

async function generateWithLLM(
  input: AgentInput,
  _provider: unknown
): Promise<WeeklyPackage | null> {
  const systemPrompt = `You are an expert Cambridge Physics teacher at SHB Modernhill. Generate a complete weekly teaching package following the Flipped Classroom methodology.

LANGUAGE REQUIREMENT: Write ALL content in fluent, grammatically correct academic English at IELTS band 7.5 or higher. Use precise physics terminology. Maintain coherence and logical flow throughout. No informal or conversational language.

RULES:
- 40-minute lesson structure: Entry Ticket (5min) → Productive Struggle (20min) → CER Challenge (10min) → Wrap-up + Mistake Journal (5min)
- No calculus. CER required for Level 3. "Ask 3 Before Me". "No Eraser" policy. Mistake Journal every lesson.
- Worksheets: Level 1 (sanity check), Level 2 (mistake hunter), Level 3 (CER challenge)
- Include differentiation for Support (IEP) and Challenge (advanced) students
- Lab experiments must use available school equipment (no expensive/rare items)
- Answer keys must include detailed step-by-step solutions

CRITICAL: Every section MUST contain real, substantive content. No empty arrays, no empty objects, no placeholder text. Each lesson plan must have 4 phases with full activities. Each worksheet level must have at least 2 questions. Answer keys must have complete entries with question text and answer. WA blast must mention the correct topic.

Output MUST be valid JSON matching the WeeklyPackage type exactly.`

  const prompt = `Generate a weekly physics teaching package for:
- Grade: ${input.grade}
- Week: ${input.week_number}
- Topic: ${input.topic}
- Syllabus: ${input.syllabus_ref}
- Calendar status: ${input.calendar_status}${input.exam_type !== "none" ? ` (${input.exam_type})` : ""}
- Common misconceptions: ${input.previous_misconceptions.join("; ")}

Return a JSON object with these keys:
- lesson_plan: { title, grade: ${input.grade}, duration_minutes: 40, phases: [{ phase, minutes, hook_question?, activity, mythbuster_or_analogy?, group_rule?, differentiation?, phenomenon?, cer_template?, reflection_prompt?, peer_grading_instruction? }] }
- worksheet: { title, levels: [{ level: 1, name: "Sanity Check", minutes: 10, questions }, { level: 2, name: "Mistake Hunter", minutes: 15, questions }, { level: 3, name: "CER Challenge", minutes: 10, questions }] }
  Each question: { id, type, bloom, question, mark_scheme, peer_grade?, intentional_error?, solution_steps?, options?, correct?, explanation? }
- pre_class: { video_resource: { title, url, source, duration_minutes, key_concepts, watch_guide }, interactive_simulation: { title, url, platform, instructions, inquiry_questions }, guided_notes: { title, fill_in_blanks, completed_example }, entry_ticket_quiz: { questions: [{ question, options, correct, explanation }], passing_score } }
- lab_logistics: { lab_required, equipment_list: [{ item, quantity, status }], setup_instructions, safety_notes, lab_technician_message }
- broadcast: { wa_message, lms_post: { title, body }, parent_message }
- answer_keys: [{ question, answer, explanation }]`

  const { content } = await callLLM(prompt, {
    systemPrompt,
    temperature: 0.8,
    maxTokens: 8192,
  })

  try {
    const parsed = JSON.parse(content)
    const now = new Date().toISOString()

    return {
      academic_year: input.academic_year,
      grade: input.grade,
      week_number: input.week_number,
      topic: input.topic,
      calendar_status: input.calendar_status,
      lesson_plan: parsed.lesson_plan,
      worksheet: parsed.worksheet,
      pre_class: parsed.pre_class,
      lab_logistics: parsed.lab_logistics,
      broadcast: parsed.broadcast,
      answer_keys: parsed.answer_keys ?? [],
      generated_at: now,
      agent_version: "1.1.0-llm",
    }
  } catch (parseError) {
    console.error("Failed to parse LLM output as JSON:", parseError)
    return null
  }
}
