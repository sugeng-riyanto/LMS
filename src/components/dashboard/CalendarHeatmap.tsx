"use client"

import { useCalendarEvents } from "@/hooks/use-calendar"
import { cn } from "@/lib/utils/cn"
import { Tooltip } from "@/components/ui/tooltip"
import type { CalendarEvent } from "@/types/calendar"
import { CALENDAR_EVENT_TYPES } from "@/lib/utils/constants"
import type { CalendarEventType } from "@/lib/utils/constants"

const eventColorMap: Record<string, string> = {
  normal: "bg-green-500",
  holiday: "bg-yellow-400",
  exam: "bg-red-500",
  tryout: "bg-orange-500",
  mock_test: "bg-purple-500",
  offsite: "bg-cyan-500",
  blackout: "bg-gray-800 dark:bg-gray-600",
  pd_day: "bg-indigo-500",
}

const eventLabelMap: Record<string, string> = {
  normal: "Normal",
  holiday: "Holiday",
  exam: "Exam",
  tryout: "Tryout",
  mock_test: "Mock Test",
  offsite: "Offsite",
  blackout: "Blackout",
  pd_day: "PD Day",
}

function getEventType(event: CalendarEvent): string {
  if (CALENDAR_EVENT_TYPES.includes(event.type as CalendarEventType)) {
    return event.type
  }
  return "normal"
}

interface CalendarHeatmapProps {
  events?: CalendarEvent[]
  year?: number
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function CalendarHeatmap({ events: eventsProp, year }: CalendarHeatmapProps) {
  const { data: fetchedEvents } = useCalendarEvents()
  const events = eventsProp ?? fetchedEvents ?? []
  const currentYear = year ?? new Date().getFullYear()

  const eventsByDate = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const key = event.date
    if (!eventsByDate.has(key)) eventsByDate.set(key, [])
    eventsByDate.get(key)!.push(event)
  }

  const months: { name: string; days: number }[] = []
  for (let m = 0; m < 12; m++) {
    months.push({
      name: MONTHS[m],
      days: new Date(currentYear, m + 1, 0).getDate(),
    })
  }

  const dayOfWeek = (month: number, day: number) => new Date(currentYear, month, day).getDay()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Calendar Heatmap {currentYear}</h3>
      <div className="flex flex-wrap gap-2">
        {Object.entries(eventLabelMap).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn("h-3 w-3 rounded-sm", eventColorMap[key])} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {months.map((month, monthIdx) => (
          <div key={month.name} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{month.name}</p>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: dayOfWeek(monthIdx, 1) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-2.5 w-2.5" />
              ))}
              {Array.from({ length: month.days }).map((_, day) => {
                const dateStr = `${currentYear}-${String(monthIdx + 1).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`
                const dayEvents = eventsByDate.get(dateStr)
                const eventType = dayEvents && dayEvents.length > 0
                  ? getEventType(dayEvents[0])
                  : null

                return (
                  <Tooltip
                    key={day}
                    content={
                      dayEvents && dayEvents.length > 0 ? (
                        <div className="space-y-0.5">
                          {dayEvents.map((e) => (
                            <p key={e.id}>
                              {e.title}
                              {e.type ? ` (${eventLabelMap[e.type] ?? e.type})` : ""}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>{dateStr}</p>
                      )
                    }
                  >
                    <div
                      className={cn(
                        "h-2.5 w-2.5 rounded-sm",
                        eventType
                          ? eventColorMap[eventType] ?? "bg-muted"
                          : "bg-muted/40"
                      )}
                    />
                  </Tooltip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
