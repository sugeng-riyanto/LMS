import type { AgentInput, WeeklyPackage } from "./agent-types"
import { generateLessonPlan } from "./lesson-plan-agent"
import { generateWorksheet } from "./worksheet-agent"
import { generatePreClass } from "./flipped-curator"
import { generateLogistics } from "./logistics-agent"
import { generateBroadcast } from "./broadcast-agent"
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
    "Siswa mengira displacement dan distance itu sama",
    "Siswa mengira percepatan negatif selalu berarti perlambatan",
    "Siswa mengira benda yang diam tidak memiliki gaya yang bekerja",
    "Siswa kesulitan membedakan kecepatan rata-rata dan kecepatan sesaat"
  ],
  forces: [
    "Siswa mengira gaya diperlukan untuk mempertahankan gerak",
    "Siswa mengira aksi-reaksi bekerja pada benda yang sama",
    "Siswa mengira benda lebih berat jatuh lebih cepat"
  ],
  energy: [
    "Siswa mengira energi bisa 'habis' dan 'diciptakan'",
    "Siswa mengira energi hanya ada saat benda bergerak"
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
    "Siswa mungkin mengalami kesulitan dengan konsep abstrak dalam topik ini",
    "Siswa perlu bantuan menghubungkan konsep dengan aplikasi sehari-hari"
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
