const ACADEMIC_YEAR_START = new Date(2026, 6, 13)
const ACADEMIC_YEAR_END = new Date(2027, 5, 12)

export function getAcademicYear(): string {
  return "2026-2027"
}

export function getCurrentWeek(date?: Date): number {
  const target = date || new Date()
  const diff = target.getTime() - ACADEMIC_YEAR_START.getTime()
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, 52))
}

export function getSemester(week: number): 1 | 2 {
  return week <= 22 ? 1 : 2
}

export function getWeekDateRange(week: number): { start: Date; end: Date } {
  const start = new Date(ACADEMIC_YEAR_START)
  start.setDate(start.getDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 4)
  return { start, end }
}

export function getEffectiveDays(week: number): number {
  const blackoutWeeks = new Set([35, 36, 37, 38, 39, 40, 41, 42])
  const examWeeks = new Set([6, 7, 8, 20, 21, 22])
  const shortWeeks = new Set([1, 12, 13, 14])

  if (blackoutWeeks.has(week)) return 0
  if (examWeeks.has(week)) return 3
  if (shortWeeks.has(week)) return 4
  return 5
}

export function getGradeSequence(grade: number, week: number): string {
  const sequences: Record<number, Record<number, string>> = {
    7: {
      1: "Introduction to Physics & Measurement",
      2: "Physical Quantities & SI Units",
      3: "Kinematics: Distance and Displacement",
      4: "Kinematics: Speed, Velocity, and Acceleration",
      5: "Motion Graphs",
      6: "Forces: Types and Effects",
      7: "Newton's Laws of Motion",
      8: "Friction and Its Applications",
      9: "Energy: Forms and Sources",
      10: "Energy Transfers and Conservation",
      11: "Simple Machines",
      12: "Pressure: Solid, Liquid, and Gas",
      13: "Density and Buoyancy",
      14: "Thermal Physics: Heat Transfer",
      15: "Waves: Introduction and Properties",
      16: "Sound Waves",
      17: "Light: Reflection",
      18: "Light: Refraction",
      19: "Electricity: Basic Circuits",
      20: "Series and Parallel Circuits",
      21: "Magnetism",
      22: "Review and Assessment"
    },
    10: {
      1: "Kinematics: Equations of Motion",
      2: "Kinematics: Graphical Analysis",
      3: "Dynamics: Newton's Laws",
      4: "Dynamics: Momentum",
      5: "Forces: Friction and Drag",
      6: "Forces: Circular Motion",
      7: "Energy: Work and Power",
      8: "Energy: Conservation Principles",
      9: "Thermal Physics: Specific Heat Capacity",
      10: "Thermal Physics: Latent Heat",
      11: "Waves: Properties and Behavior",
      12: "Waves: Electromagnetic Spectrum",
      13: "Light: Reflection and Refraction",
      14: "Light: Lenses and Optical Instruments",
      15: "Sound: Properties and Applications",
      16: "Sound: Ultrasound",
      17: "Electricity: Current and Voltage",
      18: "Electricity: Resistance and Ohm's Law",
      19: "Magnetism: Magnetic Fields",
      20: "Magnetism: Electromagnets",
      21: "Electromagnetic Induction",
      22: "Review and Assessment"
    }
  }

  const gradeSeq = sequences[grade]
  if (!gradeSeq) {
    return `Grade ${grade} — Week ${week}: Physics`
  }

  return gradeSeq[week] || `Grade ${grade} — Week ${week}: Physics`
}
