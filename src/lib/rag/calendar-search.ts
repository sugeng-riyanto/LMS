import { createClient } from "../supabase/client"

export interface CalendarEventResult {
  id: string
  title: string
  date: string
  type: string
  description: string | null
  grade: number | null
}

export interface ConflictResult {
  events: CalendarEventResult[]
  severity: "none" | "low" | "medium" | "high" | "critical"
  action: "proceed" | "adjust" | "skip" | "emergency"
}

const SEVERITY_MAP: Record<string, { severity: ConflictResult["severity"]; action: ConflictResult["action"] }> = {
  normal: { severity: "none", action: "proceed" },
  holiday: { severity: "high", action: "skip" },
  exam: { severity: "medium", action: "adjust" },
  tryout: { severity: "medium", action: "adjust" },
  mock_test: { severity: "low", action: "adjust" },
  offsite: { severity: "high", action: "skip" },
  blackout: { severity: "critical", action: "emergency" },
  pd_day: { severity: "medium", action: "skip" }
}

function getDefaultConflict(): ConflictResult {
  return { events: [], severity: "none", action: "proceed" }
}

function determineConflict(events: CalendarEventResult[]): ConflictResult {
  if (events.length === 0) return getDefaultConflict()

  let highestSeverity: ConflictResult["severity"] = "none"
  let highestAction: ConflictResult["action"] = "proceed"

  for (const event of events) {
    const mapping = SEVERITY_MAP[event.type] || SEVERITY_MAP.normal
    const severityOrder = ["none", "low", "medium", "high", "critical"]
    const currentIdx = severityOrder.indexOf(highestSeverity)
    const eventIdx = severityOrder.indexOf(mapping.severity)

    if (eventIdx > currentIdx) {
      highestSeverity = mapping.severity
      highestAction = mapping.action
    }
  }

  return { events, severity: highestSeverity, action: highestAction }
}

export async function querySHBCalendar(
  weekStart: Date,
  weekEnd: Date
): Promise<ConflictResult> {
  try {
    const supabase = createClient()

    const startStr = weekStart.toISOString().split("T")[0]
    const endStr = weekEnd.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("academic_calendars")
      .select("*")
      .gte("date", startStr)
      .lte("date", endStr)
      .order("date", { ascending: true })

    if (error) {
      console.error("Calendar query failed:", error)
      return getDefaultConflict()
    }

    const events = (data || []) as CalendarEventResult[]
    return determineConflict(events)
  } catch (err) {
    console.error("Calendar search error:", err)
    return getDefaultConflict()
  }
}
