import { z } from "zod"

export const calendarEventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Event title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.enum([
    "normal", "holiday", "exam", "tryout",
    "mock_test", "offsite", "blackout", "pd_day"
  ], "Invalid calendar event type"),
  description: z.string().max(500).optional(),
  grade: z.number().int().min(7).max(12).optional()
})

export const calendarEventArraySchema = z.array(calendarEventSchema).min(1, "At least one event required")

export const calendarImportSchema = z.object({
  events: calendarEventArraySchema,
  source: z.string().optional(),
  imported_at: z.string().datetime().optional()
})

export type CalendarEventZod = z.infer<typeof calendarEventSchema>

export function validateCalendarEvent(data: unknown) {
  const result = calendarEventSchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      path: e.path.join("."),
      message: e.message
    }))
    return { success: false as const, errors }
  }
  return { success: true as const, data: result.data }
}

export function validateCalendarEvents(data: unknown) {
  const result = calendarEventArraySchema.safeParse(data)
  if (!result.success) {
    const errors = result.error.issues.map(e => ({
      path: e.path.join("."),
      message: e.message
    }))
    return { success: false as const, errors }
  }
  return { success: true as const, data: result.data }
}
