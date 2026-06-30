import { Grade, GRADES } from "./constants"

export const ACADEMIC_YEAR = {
  start: new Date(2026, 6, 13),
  end: new Date(2027, 5, 12),
}

export function getCurrentAcademicYear(): string {
  return "2026-2027"
}

export function getCurrentWeekNumber(date: Date = new Date()): number {
  const start = new Date(2026, 6, 13)
  const diff = date.getTime() - start.getTime()
  const week = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  return Math.max(1, Math.min(week, 52))
}

export function getWeekDateRange(weekNumber: number): { start: Date; end: Date } {
  const start = new Date(2026, 6, 13)
  start.setDate(start.getDate() + (weekNumber - 1) * 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 4)
  return { start, end }
}

export function getSemester(weekNumber: number): 1 | 2 {
  return weekNumber <= 22 ? 1 : 2
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getGradeDisplay(grade: Grade): string {
  return `Grade ${grade}`
}
