"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRBAC } from "@/hooks/use-rbac"
import { useTeacherSubjects } from "@/hooks/use-teacher-subjects"
import { Plus, Trash2, Share2, ExternalLink, Loader2, Play, BookOpen, FileText, Pencil, Upload, Check } from "lucide-react"
import toast from "react-hot-toast"
import { getGradeSequence } from "@/lib/utils/week-calculator"
import { getObjectivesForGrade } from "@/lib/syllabus/objectives-data"
import { SUBJECTS } from "@/lib/utils/constants"

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
  published: boolean
  score_category: string | null
  max_score: number | null
  subject: string | null
  created_at: string
}

export default function WorksheetsPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const teacherSubjects = useTeacherSubjects()
  const canManage = isSuperAdmin || isTeacher
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState("")
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
    additional_links: "",
    score_category: "classwork",
    max_score: "100",
    subject: "PHY"
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

  async function load(subject?: string) {
    try {
      const params = subject ? `?subject=${subject}` : ""
      const res = await fetch("/api/worksheets" + params)
      if (res.ok) setWorksheets(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    load(subjectFilter)
  }, [subjectFilter])

  // Default subject to teacher's first assigned subject
  useEffect(() => {
    if (teacherSubjects.length > 0 && !subjectFilter) {
      setSubjectFilter(teacherSubjects[0])
      setForm(p => ({ ...p, subject: teacherSubjects[0] }))
    }
  }, [teacherSubjects, subjectFilter])

  const availableSubjects = useMemo(() => {
    return SUBJECTS.filter(s => teacherSubjects.length === 0 || teacherSubjects.includes(s.code))
  }, [teacherSubjects])

  async function handleSave() {
    if (!form.title) { toast.error("Title is required"); return }
    if (!form.pdf_url) { toast.error("Upload a PDF first"); return }
    setSaving(true)
    try {
      const additionalLinks = form.additional_links
        ? form.additional_links.split("\n").filter(Boolean).map((line) => {
            const [url, title = "", type = "pdf"] = line.split("|").map(s => s.trim())
            return { url, title, type }
          })
        : []

      const body = {
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
        score_category: form.score_category || null,
        max_score: form.max_score ? Number(form.max_score) : 100,
        subject: form.subject || "PHY",
      }

      const url = editingId ? `/api/worksheets/${editingId}` : "/api/worksheets"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success(editingId ? "Worksheet updated!" : "Worksheet created!")
      handleCancel()
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

  function handleEdit(ws: Worksheet) {
    const addLinks = (ws.media_links || []).map(m => `${m.url} | ${m.title} | ${m.type}`).join("\n")
    setForm({
      title: ws.title,
      grade: String(ws.grade),
      week_number: String(ws.week_number || ""),
      topic: ws.topic || "",
      pdf_url: ws.pdf_url,
      pdf_pages: String(ws.pdf_pages || 1),
      objectives: "",
      reference_pdf_url: ws.reference_pdf_url || "",
      theory_video_url: ws.theory_video_url || "",
      theory_video_title: ws.theory_video_title || "",
      additional_links: addLinks,
      score_category: ws.score_category || "classwork",
      max_score: String(ws.max_score ?? 100),
      subject: ws.subject || "PHY",
    })
    const savedObjectives = (ws.objectives || "").split("\n").filter(Boolean)
    setSelectedObjectives(new Set(savedObjectives))
    setUploadedFileName(ws.pdf_url ? "PDF attached" : "")
    setEditingId(ws.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: "", grade: "10", week_number: "", topic: "", pdf_url: "", pdf_pages: "1", objectives: "", reference_pdf_url: "", theory_video_url: "", theory_video_title: "", additional_links: "", score_category: "classwork", max_score: "100", subject: "PHY" })
    setSelectedObjectives(new Set())
    setUploadedFileName("")
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { toast.error("Only PDF files allowed"); return }
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return }
    setUploading(true)
    setUploadedFileName(file.name)
    try {
      // Detect page count from local PDF before uploading
      try {
        // Dynamically load PDF.js from the hosted script (avoids Node canvas dependency)
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script")
            script.src = "/pdfjs/pdf.min.js"
            script.onload = () => {
              ;(window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js"
              resolve()
            }
            script.onerror = reject
            document.head.appendChild(script)
          })
        }
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await (window as any).pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const pages = pdf.numPages
        updateForm({ pdf_pages: String(pages) })
        toast.success(`Detected ${pages} page${pages > 1 ? "s" : ""}`)
      } catch {
        // Fallback: keep default
      }
      // Upload to Supabase Storage
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Upload failed") }
      const data = await res.json()
      updateForm({ pdf_url: data.url })
      toast.success("PDF uploaded!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
      setUploadedFileName("")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (!canManage) return <p className="p-8 text-center text-muted-foreground">Access denied.</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shared Worksheets</h1>
          <p className="text-sm text-muted-foreground">Upload PDF worksheets for students to annotate online</p>
        </div>
        <Button onClick={() => showForm ? handleCancel() : setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? "Close" : "New Worksheet"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm whitespace-nowrap">Subject:</Label>
        <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm">
          {availableSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
        </select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{editingId ? "Edit Worksheet" : "New Worksheet"}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-5">
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

            {/* Worksheet — Upload PDF */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                Worksheet PDF
              </h3>
              <div className="space-y-2">
                <Label>Upload PDF file *</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    {uploading ? "Uploading..." : "Choose PDF"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFilePick} />
                  {uploadedFileName && !uploading && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" /> {uploadedFileName}
                      <button type="button" onClick={() => { setUploadedFileName(""); updateForm({ pdf_url: "" }) }}
                        className="ml-1 text-red-500 hover:text-red-700 font-medium">✕</button>
                    </span>
                  )}
                </div>
              </div>
              {form.pdf_url && (
                <div className="text-xs text-muted-foreground truncate">
                  PDF URL: <span className="font-mono">{form.pdf_url}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label>Number of Pages</Label>
                <Input type="number" min={1} max={50} value={form.pdf_pages}
                  onChange={e => updateForm({ pdf_pages: e.target.value })} />
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

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <select value={form.subject} onChange={e => updateForm({ subject: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {availableSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
              </select>
            </div>

            {/* Assessment Category */}
            <div className="space-y-2">
              <Label>Assessment Category</Label>
              <select value={form.score_category} onChange={e => updateForm({ score_category: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="classwork">Classwork (40%)</option>
                <option value="unit_test">Unit Test (20%)</option>
                <option value="project">Project (10%)</option>
                <option value="homework">Homework (10%)</option>
                <option value="mid_semester">Mid Semester (10%)</option>
                <option value="final_semester">Final Semester (10%)</option>
              </select>
            </div>

            {/* Max Score */}
            <div className="space-y-2">
              <Label>Max Score</Label>
              <Input type="number" min={1} value={form.max_score} onChange={e => updateForm({ max_score: e.target.value })}
                placeholder="100" />
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
              {saving ? "Saving..." : editingId ? "Update Worksheet" : "Save Worksheet"}
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
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(ws)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ws.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {ws.topic && <Badge variant="secondary" className="mb-2">{ws.topic}</Badge>}
                  {ws.score_category && <Badge variant="outline" className="mb-2 text-[10px] border-primary/30 text-primary">{ws.score_category.replace(/_/g, " ")}</Badge>}
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
                    <Button size="sm" variant={ws.published ? "default" : "outline"} className={ws.published ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""} onClick={async () => {
                      try {
                        const res = await fetch(`/api/worksheets/${ws.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ published: !ws.published }),
                        })
                        if (res.ok) { ws.published = !ws.published; toast.success(ws.published ? "Published to dashboard!" : "Unpublished"); load() }
                        else toast.error("Failed")
                      } catch { toast.error("Failed") }
                    }}>
                      {ws.published ? "✓ Published" : "Publish"}
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
