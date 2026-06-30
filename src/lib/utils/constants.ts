export const APP_NAME = "Physics Command Center"
export const APP_DESCRIPTION = "AI-Powered Physics Teaching Platform for SHB Modernhill"
export const ACADEMIC_YEAR = "2026-2027"

export const GRADES = [7, 8, 9, 10, 11, 12] as const
export type Grade = (typeof GRADES)[number]

export const GRADE_LABELS: Record<Grade, string> = {
  7: "Grade 7 - Lower Secondary",
  8: "Grade 8 - Lower Secondary",
  9: "Grade 9 - Half IGCSE",
  10: "Grade 10 - IGCSE",
  11: "Grade 11 - AS Level",
  12: "Grade 12 - A Level + TKA",
}

export const ROLES = ["super_admin", "teacher", "lab_assistant", "student"] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  teacher: "Teacher",
  lab_assistant: "Lab Assistant",
  student: "Student",
}

export const PACKAGE_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "published",
  "archived",
] as const
export type PackageStatus = (typeof PACKAGE_STATUSES)[number]

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
}

export const CALENDAR_EVENT_TYPES = [
  "normal",
  "holiday",
  "exam",
  "tryout",
  "mock_test",
  "offsite",
  "blackout",
  "pd_day",
] as const
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number]

export const LESSON_DURATION = 40

export const WEEKLY_HOURS: Record<Grade, number> = {
  7: 3,
  8: 3,
  9: 3,
  10: 3,
  11: 4,
  12: 4,
}

export const SYLLABUS_REF: Record<Grade, string> = {
  7: "0893 Stage 7",
  8: "0893 Stage 8/9",
  9: "0625 (Half)",
  10: "0625 (Full)",
  11: "9702 AS",
  12: "9702 A2 + TKA",
}

export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  DASHBOARD: "/dashboard",
  GRADES: "/grades",
  GENERATE: "/generate",
  MEMORY: "/memory",
  LAB: "/lab",
  JOURNALS: "/journals",
  CALENDAR: "/calendar",
  SYLLABUS: "/syllabus",
  LESSON_PLAN: "/lesson-plan",
  HELP: "/help",
  ANALYTICS: "/analytics",
  SETTINGS: "/settings",
  STUDENT_MY_WEEK: "/my-week",
  STUDENT_JOURNAL: "/my-journal",
  STUDENT_PRE_CLASS: "/pre-class",
} as const
