"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useCalendarEvents } from "@/hooks/use-calendar"
import CalendarHeatmap from "@/components/dashboard/CalendarHeatmap"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, CalendarDays, List } from "lucide-react"
import { GRADES, CALENDAR_EVENT_TYPES } from "@/lib/utils/constants"
import type { CalendarEvent } from "@/types/calendar"
import toast from "react-hot-toast"

export default function CalendarPage() {
  const { isSuperAdmin } = useRBAC()
  const { data: events, isLoading } = useCalendarEvents()
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [filterGrade, setFilterGrade] = useState<number | "all">("all")
  const [filterType, setFilterType] = useState<string>("all")

  const filteredEvents = (events ?? []).filter((e) => {
    if (filterGrade !== "all" && e.grade !== filterGrade) return false
    if (filterType !== "all" && e.type !== filterType) return false
    return true
  })

  async function handleXLSXUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/calendar/upload", { method: "POST", body: formData })
      if (res.ok) {
        toast.success("Calendar uploaded!")
        e.target.value = ""
      } else {
        toast.error("Upload failed.")
      }
    } catch {
      toast.error("Upload failed.")
    }
  }

  const eventTypeColors: Record<string, string> = {
    normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    holiday: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    exam: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    tryout: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    mock_test: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    offsite: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    blackout: "bg-gray-700 text-white dark:bg-gray-600",
    pd_day: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">SHB academic calendar and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="mr-1 h-4 w-4" />
            Heatmap
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="mr-1 h-4 w-4" />
            List
          </Button>
          {isSuperAdmin && (
            <Label className="cursor-pointer">
              <Button variant="outline" size="sm">
                <Upload className="mr-1 h-4 w-4" />
                Upload XLSX
              </Button>
              <Input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleXLSXUpload}
              />
            </Label>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Grade</Label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Grades</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Event Type</Label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Types</option>
            {CALENDAR_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
      </div>

      {view === "calendar" ? (
        <Card>
          <CardContent className="pt-6">
            <CalendarHeatmap events={filteredEvents} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Event List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No events found.</p>
            ) : (
              <div className="space-y-2">
                {filteredEvents
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => (
                    <div key={event.id} className="flex items-center gap-4 rounded-lg border p-3 text-sm">
                      <div className="min-w-[80px]">
                        <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.start_time} - {event.end_time}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      <Badge className={eventTypeColors[event.type] ?? ""}>
                        {event.type.replace(/_/g, " ")}
                      </Badge>
                      {event.grade && (
                        <Badge variant="outline">G{event.grade}</Badge>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
