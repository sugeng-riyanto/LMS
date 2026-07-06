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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Upload, CalendarDays, List, Plus, Pencil, Trash2 } from "lucide-react"
import { GRADES, CALENDAR_EVENT_TYPES } from "@/lib/utils/constants"
import type { CalendarEvent } from "@/types/calendar"
import toast from "react-hot-toast"

const now = new Date()
const today = now.toISOString().split("T")[0]

const emptyForm = {
  academic_year: "2026-2027",
  semester: 1,
  month: now.getMonth() + 1,
  week_number: 1,
  start_date: today,
  end_date: today,
  effective_days: 5,
  event_name: "",
  event_type: "normal",
  affected_grades: [7, 8, 9, 10, 11, 12],
  is_holiday: false,
  notes: "",
}

export default function CalendarPage() {
  const { isSuperAdmin } = useRBAC()
  const { data: events, isLoading, refetch } = useCalendarEvents()
  const [view, setView] = useState<"calendar" | "list">("list")
  const [filterGrade, setFilterGrade] = useState<number | "all">("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [gradeSelection, setGradeSelection] = useState<Record<number, boolean>>({
    7: true, 8: true, 9: true, 10: true, 11: true, 12: true,
  })
  const [saving, setSaving] = useState(false)

  const filteredEvents = (events ?? []).filter((e) => {
    if (filterGrade !== "all" && e.grade !== filterGrade) return false
    if (filterType !== "all" && e.type !== filterType) return false
    return true
  })

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setGradeSelection({ 7: true, 8: true, 9: true, 10: true, 11: true, 12: true })
    setDialogOpen(true)
  }

  function openEdit(event: CalendarEvent) {
    setEditingId(event.id ?? null)
    const affGrades = (event as any).affected_grades ?? (event.grade ? [event.grade] : [7, 8, 9, 10, 11, 12])
    const grades: Record<number, boolean> = {}
    GRADES.forEach((g) => { grades[g] = false })
    setForm({
      academic_year: "2026-2027",
      semester: 1,
      month: new Date(event.date).getMonth() + 1,
      week_number: 1,
      start_date: event.date,
      end_date: event.date,
      effective_days: 5,
      event_name: event.title,
      event_type: event.type,
      affected_grades: affGrades,
      is_holiday: event.type === "holiday",
      notes: event.description ?? "",
    })
    GRADES.forEach((g) => { grades[g] = affGrades.includes(g) })
    setGradeSelection(grades)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.event_name) { toast.error("Event name is required"); return }
    setSaving(true)
    try {
      const selectedGrades = GRADES.filter((g) => gradeSelection[g])
      const body = {
        ...form,
        affected_grades: selectedGrades,
        is_holiday: form.event_type === "holiday",
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/calendar/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/calendar", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        })
      }
      if (res.ok) {
        toast.success(editingId ? "Updated!" : "Created!")
        setDialogOpen(false)
        refetch()
      } else { toast.error("Failed to save.") }
    } catch { toast.error("Failed to save.") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted!"); refetch() }
      else { toast.error("Failed to delete.") }
    } catch { toast.error("Failed to delete.") }
  }

  async function handleXLSXUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/admin/upload-calendar", { method: "POST", body: fd })
      if (res.ok) { toast.success("Calendar uploaded!"); e.target.value = ""; refetch() }
      else { toast.error("Upload failed.") }
    } catch { toast.error("Upload failed.") }
  }

  const eventTypeColors: Record<string, string> = {
    normal: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    holiday: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    exam: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    tryout: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    mock_test: "bg-primary/10 text-primary font-medium dark:bg-primary/20",
    offsite: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    blackout: "bg-gray-700 text-white dark:bg-gray-600",
    pd_day: "bg-primary/10 text-primary font-medium dark:bg-primary/20",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Manage the academic calendar. Add or edit events such as holidays, exams, tryouts, and off-site activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === "calendar" ? "default" : "outline"} size="sm" onClick={() => setView("calendar")}>
            <CalendarDays className="mr-1 h-4 w-4" />Heatmap
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
            <List className="mr-1 h-4 w-4" />List
          </Button>
          {isSuperAdmin && (
            <>
              <Button size="sm" onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Event</Button>
              <Button variant="outline" size="sm" onClick={async () => {
                try {
                  const res = await fetch("/api/calendar/template")
                  if (!res.ok) { toast.error("Download failed"); return }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a"); a.href = url; a.download = "calendar-template.xlsx"; a.click()
                  URL.revokeObjectURL(url)
                } catch { toast.error("Download failed") }
              }}><Upload className="mr-1 h-4 w-4" />Template</Button>
              <Label className="cursor-pointer">
                <Button variant="outline" size="sm"><Upload className="mr-1 h-4 w-4" />Upload XLSX</Button>
                <Input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleXLSXUpload} />
              </Label>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Grade</Label>
          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value === "all" ? "all" : Number(e.target.value))} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="all">All Grades</option>
            {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Event Type</Label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="all">All Types</option>
            {CALENDAR_EVENT_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
          </select>
        </div>
      </div>

      {view === "calendar" ? (
        <Card><CardContent className="pt-6"><CalendarHeatmap events={filteredEvents} /></CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Event List</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />))}</div>
            ) : filteredEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No events found.</p>
            ) : (
              <div className="space-y-2">
                {filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event) => (
                  <div key={event.id} className="flex items-center gap-4 rounded-lg border p-3 text-sm">
                    <div className="min-w-[80px]">
                      <p className="font-medium">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      {event.description && <p className="text-xs text-muted-foreground">{event.description}</p>}
                    </div>
                    <Badge className={eventTypeColors[event.type] ?? ""}>{event.type.replace(/_/g, " ")}</Badge>
                    {event.grade && <Badge variant="outline">G{event.grade}</Badge>}
                    {isSuperAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id ?? "")}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Add"} Event</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-1">
              <Label>Event Name *</Label>
              <Input value={form.event_name} onChange={(e) => setForm((p) => ({ ...p, event_name: e.target.value }))} placeholder="e.g. Midterm Exam" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Event Type</Label>
                <select value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  {CALENDAR_EVENT_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Effective Days</Label>
                <Input type="number" value={form.effective_days} onChange={(e) => setForm((p) => ({ ...p, effective_days: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Affected Grades</Label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <label key={g} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={gradeSelection[g] ?? false} onChange={() => setGradeSelection((p) => ({ ...p, [g]: !p[g] }))} className="h-4 w-4 rounded" />
                    G{g}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
