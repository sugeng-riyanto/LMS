import type { AgentInput, WeeklyPackage } from "./agent-types"
import { generateLessonPlan } from "./lesson-plan-agent"
import { generateWorksheet } from "./worksheet-agent"
import { generatePreClass } from "./flipped-curator"
import { generateLogistics } from "./logistics-agent"
import { generateBroadcast } from "./broadcast-agent"
import { callLLM, getActiveProvider } from "./call-llm"
import { getCurrentWeek, getAcademicYear } from "../utils/week-calculator"

const TOPIC_MAP: Record<number, Record<number, string>> = {
  7: {
    1: "Kinematics", 2: "Kinematics", 3: "Forces", 4: "Forces",
    5: "Energy", 6: "Energy", 7: "Density", 8: "Density",
    9: "Pressure", 10: "Pressure", 11: "Thermal Physics", 12: "Thermal Physics",
    13: "Waves", 14: "Waves", 15: "Light", 16: "Light",
    17: "Sound", 18: "Sound", 19: "Electricity", 20: "Electricity",
    21: "Magnetism", 22: "Magnetism"
  },
  8: {
    1: "Kinematics", 2: "Kinematics", 3: "Forces and Motion", 4: "Forces and Motion",
    5: "Energy Transfers", 6: "Energy Transfers", 7: "Work and Power", 8: "Work and Power",
    9: "Pressure in Fluids", 10: "Pressure in Fluids", 11: "Thermal Properties", 12: "Thermal Properties",
    13: "Wave Motion", 14: "Wave Motion", 15: "Reflection and Refraction", 16: "Reflection and Refraction",
    17: "Sound Waves", 18: "Sound Waves", 19: "Circuits", 20: "Circuits",
    21: "Electromagnets", 22: "Electromagnets"
  },
  9: {
    1: "Kinematics", 2: "Kinematics", 3: "Acceleration", 4: "Acceleration",
    5: "Forces", 6: "Forces", 7: "Momentum", 8: "Momentum",
    9: "Energy", 10: "Energy", 11: "Work and Power", 12: "Work and Power",
    13: "Thermal Physics", 14: "Thermal Physics", 15: "Waves", 16: "Waves",
    17: "Light and Optics", 18: "Light and Optics", 19: "Electricity", 20: "Electricity",
    21: "Magnetism", 22: "Magnetism"
  },
  10: {
    1: "Kinematics", 2: "Kinematics", 3: "Dynamics", 4: "Dynamics",
    5: "Forces", 6: "Forces", 7: "Energy", 8: "Energy",
    9: "Thermal Physics", 10: "Thermal Physics", 11: "Waves", 12: "Waves",
    13: "Light", 14: "Light", 15: "Sound", 16: "Sound",
    17: "Electricity", 18: "Electricity", 19: "Magnetism", 20: "Magnetism",
    21: "Electromagnetic Induction", 22: "Electromagnetic Induction"
  },
  11: {
    1: "Kinematics", 2: "Kinematics", 3: "Dynamics", 4: "Dynamics",
    5: "Forces", 6: "Forces", 7: "Work and Energy", 8: "Work and Energy",
    9: "Momentum", 10: "Momentum", 11: "Waves", 12: "Waves",
    13: "Superposition", 14: "Superposition", 15: "Electric Fields", 16: "Electric Fields",
    17: "Current Electricity", 18: "Current Electricity", 19: "DC Circuits", 20: "DC Circuits",
    21: "Magnetism", 22: "Magnetism"
  },
  12: {
    1: "Thermal Physics", 2: "Thermal Physics", 3: "Ideal Gases", 4: "Ideal Gases",
    5: "Oscillations", 6: "Oscillations", 7: "Gravitational Fields", 8: "Gravitational Fields",
    9: "Electric Fields", 10: "Electric Fields", 11: "Magnetic Fields", 12: "Magnetic Fields",
    13: "Electromagnetic Induction", 14: "Electromagnetic Induction", 15: "Alternating Current", 16: "Alternating Current",
    17: "Quantum Physics", 18: "Quantum Physics", 19: "Nuclear Physics", 20: "Nuclear Physics",
    21: "Particle Physics", 22: "Particle Physics"
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
        if (result) return result
      } catch (llmError) {
        console.warn("LLM generation failed, falling back to template agents:", llmError)
      }
    }

    const [lessonPlan, worksheet, preClass, logistics, broadcast] = await Promise.all([
      generateLessonPlan(input),
      generateWorksheet(input),
      generatePreClass(input),
      generateLogistics(input),
      generateBroadcast(input)
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
- broadcast: { wa_message, lms_post: { title, body }, parent_message }`

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
      generated_at: now,
      agent_version: "1.1.0-llm",
    }
  } catch (parseError) {
    console.error("Failed to parse LLM output as JSON:", parseError)
    return null
  }
}
