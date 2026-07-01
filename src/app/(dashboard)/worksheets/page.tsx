"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRBAC } from "@/hooks/use-rbac"
import { Plus, Trash2, Share2, ExternalLink, Loader2, Play, BookOpen, FileText } from "lucide-react"
import toast from "react-hot-toast"
import { getGradeSequence } from "@/lib/utils/week-calculator"
import { getObjectivesForGrade } from "@/lib/syllabus/objectives-data"

const BROAD_TOPICS = [
  "Kinematics", "Forces", "Energy", "Density", "Pressure", "Thermal",
  "Waves", "Sound", "Light", "Electricity", "Magnetism",
  "Nuclear Physics", "Space Physics", "Deformation of Solids",
  "Particle Physics", "Quantum Physics", "Medical Physics", "Astronomy and Cosmology"
]

function extractBroadTopic(topic: string): string {
  if (!topic) return ""
  const lower = topic.toLowerCase()
  if (lower.startsWith("heat") || lower.includes("heat transfer")) return "Thermal"
  if (lower.includes("electromagnet")) return "Magnetism"
  for (const t of BROAD_TOPICS) {
    if (lower.includes(t.toLowerCase())) return t
  }
  return topic
}

interface Worksheet {
  id: string
  title: string
  grade: number
  week_number: number | null
  topic: string | null
  pdf_url: string
  pdf_pages: number
  media_links: { type: string; url: string; title: string }[]
  objectives: string | null
  reference_pdf_url: string | null
  theory_video_url: string | null
  theory_video_title: string | null
  created_at: string
}

export default function WorksheetsPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canManage = isSuperAdmin || isTeacher
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    grade: "10",
    week_number: "",
    topic: "",
    pdf_url: "",
    pdf_pages: "1",
    objectives: "",
    reference_pdf_url: "",
    theory_video_url: "",
    theory_video_title: "",
    additional_links: ""
  })

  const weeks = useMemo(() => {
    const g = Number(form.grade)
    if (!g) return []
    return Array.from({ length: 22 }, (_, i) => i + 1).map(w => ({
      value: w,
      label: `Week ${w}: ${getGradeSequence(g, w)}`
    }))
  }, [form.grade])

  const broadTopic = useMemo(() => extractBroadTopic(form.topic), [form.topic])
  const matchedObjectives = useMemo(() => {
    const g = Number(form.grade)
    if (!g || !broadTopic) return []
    const items = getObjectivesForGrade(g, broadTopic)
    return items.flatMap(item => item.objectives)
  }, [form.grade, broadTopic])

  const [selectedObjectives, setSelectedObjectives] = useState<Set<string>>(new Set())

  function updateForm(updates: Partial<typeof form>) {
    setForm(p => ({ ...p, ...updates }))
  }

  function onGradeOrWeekChange(grade: string, week: string) {
    const g = Number(grade)
    const w = Number(week)
    if (g && w) {
      const seq = getGradeSequence(g, w)
      updateForm({
        grade,
        week_number: week,
        title: `${seq} Worksheet`,
        topic: seq
      })
      setSelectedObjectives(new Set())
    } else {
      updateForm({ grade, week_number: week })
    }
  }

  function toggleObjective(obj: string) {
    setSelectedObjectives(prev => {
      const next = new Set(prev)
      if (next.has(obj)) next.delete(obj)
      else next.add(obj)
      return next
    })
  }

  async function load() {
    try {
      const res = await fetch("/api/worksheets")
      if (res.ok) setWorksheets(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.title || !form.pdf_url) { toast.error("Title and Worksheet PDF URL are required"); return }
    setSaving(true)
    try {
      const additionalLinks = form.additional_links
        ? form.additional_links.split("\n").filter(Boolean).map((line) => {
            const [url, title = "", type = "pdf"] = line.split("|").map(s => s.trim())
            return { url, title, type }
          })
        : []

      const res = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          grade: Number(form.grade),
          week_number: form.week_number ? Number(form.week_number) : null,
          topic: form.topic || null,
          pdf_url: form.pdf_url,
          pdf_pages: Number(form.pdf_pages) || 1,
          media_links: additionalLinks,
          objectives: selectedObjectives.size > 0 ? Array.from(selectedObjectives).join("\n") : (form.objectives || null),
          reference_pdf_url: form.reference_pdf_url || null,
          theory_video_url: form.theory_video_url || null,
          theory_video_title: form.theory_video_title || null,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Worksheet created!")
      setShowForm(false)
      setForm({ title: "", grade: "10", week_number: "", topic: "", pdf_url: "", pdf_pages: "1", objectives: "", reference_pdf_url: "", theory_video_url: "", theory_video_title: "", additional_links: "" })
      setSelectedObjectives(new Set())
      load()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this worksheet?")) return
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted"); load() }
      else toast.error("Failed to delete")
    } catch { toast.error("Failed") }
  }

  if (!canManage) return <p className="p-8 text-center text-muted-foreground">Access denied.</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shared Worksheets</h1>
          <p className="text-sm text-muted-foreground">Upload PDF worksheets for students to annotate online</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? "Close" : "New Worksheet"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            {/* Row 1: Grade + Week */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grade *</Label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.grade}
                  onChange={e => onGradeOrWeekChange(e.target.value, form.week_number)}>
                  {[7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Week *</Label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.week_number}
                  onChange={e => onGradeOrWeekChange(form.grade, e.target.value)}>
                  <option value="">Select week...</option>
                  {weeks.map(w => (
                    <option key={w.value} value={w.value}>{w.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Title + Topic */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => updateForm({ title: e.target.value })}
                  placeholder="Auto-suggested from grade & week" />
                {form.week_number && (
                  <p className="text-xs text-muted-foreground">
                    Suggested: <button type="button" className="text-blue-600 underline"
                      onClick={() => updateForm({ title: `${getGradeSequence(Number(form.grade), Number(form.week_number))} Worksheet` })}>
                      {getGradeSequence(Number(form.grade), Number(form.week_number))} Worksheet
                    </button>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input value={form.topic} onChange={e => updateForm({ topic: e.target.value })}
                  placeholder="Auto-filled from grade & week" />
                {broadTopic && (
                  <p className="text-xs text-muted-foreground">
                    Broad topic: <Badge variant="secondary" className="text-[10px]">{broadTopic}</Badge>
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Objectives */}
            {matchedObjectives.length > 0 && (
              <div className="space-y-2">
                <Label>Learning Objectives <span className="text-xs text-muted-foreground font-normal">(check relevant ones)</span></Label>
                <div className="max-h-48 overflow-y-auto rounded-lg border p-3 space-y-1.5">
                  {matchedObjectives.map((obj, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer text-sm">
                      <input type="checkbox" className="mt-0.5"
                        checked={selectedObjectives.has(obj)}
                        onChange={() => toggleObjective(obj)} />
                      <span className={selectedObjectives.has(obj) ? "font-medium" : "text-muted-foreground"}>{obj}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="text-xs text-blue-600 underline"
                    onClick={() => setSelectedObjectives(new Set(matchedObjectives))}>Select All</button>
                  <button type="button" className="text-xs text-muted-foreground underline"
                    onClick={() => setSelectedObjectives(new Set())}>Clear</button>
                  <span className="text-xs text-muted-foreground">{selectedObjectives.size} selected</span>
                </div>
              </div>
            )}

            {/* Separator */}
            <hr className="border-dashed" />

            {/* Worksheet PDF (Canvas) */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                Worksheet PDF <span className="text-xs font-normal text-muted-foreground">(for annotation canvas)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PDF URL *</Label>
                  <Input value={form.pdf_url} onChange={e => updateForm({ pdf_url: e.target.value })}
                    placeholder="docs.google.com/document/d/... or direct PDF" />
                </div>
                <div className="space-y-2">
                  <Label>Number of Pages</Label>
                  <Input type="number" min={1} max={50} value={form.pdf_pages}
                    onChange={e => updateForm({ pdf_pages: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Reference PDF (Theory) */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Reference PDF <span className="text-xs font-normal text-muted-foreground">(theory material)</span>
              </h3>
              <Input value={form.reference_pdf_url} onChange={e => updateForm({ reference_pdf_url: e.target.value })}
                placeholder="drive.google.com/file/d/... or direct PDF link (optional)" />
            </div>

            {/* Theory Video */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <Play className="h-4 w-4 text-red-500" />
                Theory Video <span className="text-xs font-normal text-muted-foreground">(YouTube embed)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>YouTube URL</Label>
                  <Input value={form.theory_video_url} onChange={e => updateForm({ theory_video_url: e.target.value })}
                    placeholder="youtube.com/watch?v=... (optional)" />
                </div>
                <div className="space-y-2">
                  <Label>Video Title</Label>
                  <Input value={form.theory_video_title} onChange={e => updateForm({ theory_video_title: e.target.value })}
                    placeholder="e.g. Introduction to Forces" />
                </div>
              </div>
            </div>

            {/* Additional Links */}
            <div className="space-y-2">
              <Label>Additional Embed Links <span className="text-xs text-muted-foreground font-normal">(one per line: url | title | type)</span></Label>
              <textarea className="w-full min-h-[60px] rounded-lg border border-input bg-background p-2 text-sm"
                value={form.additional_links}
                onChange={e => updateForm({ additional_links: e.target.value })}
                placeholder="https://docs.google.com/presentation/d/... | Notes | slides&#10;https://drive.google.com/file/d/... | Worksheet Key | pdf" />
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Worksheet"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : worksheets.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No worksheets yet. Create one above!</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map(ws => {
            const publicUrl = `${window.location.origin}/worksheet/public/${ws.id}`
            return (
              <Card key={ws.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{ws.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Grade {ws.grade}{ws.week_number ? ` · Week ${ws.week_number}` : ""}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ws.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ws.topic && <Badge variant="secondary" className="mb-2">{ws.topic}</Badge>}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ws.reference_pdf_url && <Badge variant="outline" className="text-[10px]">📄 Ref PDF</Badge>}
                    {ws.theory_video_url && <Badge variant="outline" className="text-[10px]">🎬 Theory Video</Badge>}
                    {ws.objectives && <Badge variant="outline" className="text-[10px]">🎯 Objectives</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(publicUrl, "_blank")}>
                      <ExternalLink className="mr-1 h-3 w-3" /> Open
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await navigator.clipboard.writeText(publicUrl)
                      toast.success("Link copied!")
                    }}>
                      <Share2 className="mr-1 h-3 w-3" /> Share
                    </Button>
                  </div>
                  <div className="mt-2 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(publicUrl)}`}
                      alt="QR" className="w-16 h-16 mx-auto rounded border"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
