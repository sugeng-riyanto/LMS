"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRBAC } from "@/hooks/use-rbac"
import { Plus, Trash2, Share2, ExternalLink, Loader2, Play, BookOpen, FileText, Pencil, Upload, Check, ImageIcon } from "lucide-react"
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
  page_images: string[] | null
  media_links: { type: string; url: string; title: string }[]
  objectives: string | null
  reference_pdf_url: string | null
  theory_video_url: string | null
  theory_video_title: string | null
  created_at: string
}

function loadPDFjs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) return resolve((window as any).pdfjsLib)
    const s = document.createElement("script")
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.js"
    s.onload = () => {
      (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js"
      resolve((window as any).pdfjsLib)
    }
    s.onerror = reject
    document.head.appendChild(s)
  })
}

export default function WorksheetsPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canManage = isSuperAdmin || isTeacher
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertProgress, setConvertProgress] = useState("")
  const [uploadedFileName, setUploadedFileName] = useState("")
  const [pageImages, setPageImages] = useState<string[]>([])
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
    if (!form.title) { toast.error("Title is required"); return }
    const hasPdfUrl = form.pdf_url && form.pdf_url.trim().length > 0
    const hasPageImgs = pageImages.length > 0
    if (!hasPdfUrl && !hasPageImgs) {
      toast.error("Upload a PDF using the button above, or paste a PDF URL in the field below")
      return
    }
    setSaving(true)
    try {
      const additionalLinks = form.additional_links
        ? form.additional_links.split("\n").filter(Boolean).map((line) => {
            const [url, title = "", type = "pdf"] = line.split("|").map(s => s.trim())
            return { url, title, type }
          })
        : []

      const body: Record<string, any> = {
        title: form.title,
        grade: Number(form.grade),
        week_number: form.week_number ? Number(form.week_number) : null,
        topic: form.topic || null,
        pdf_url: hasPageImgs ? "" : form.pdf_url,
        pdf_pages: Number(form.pdf_pages) || 1,
        media_links: additionalLinks,
        objectives: selectedObjectives.size > 0 ? Array.from(selectedObjectives).join("\n") : (form.objectives || null),
        reference_pdf_url: form.reference_pdf_url || null,
        theory_video_url: form.theory_video_url || null,
        theory_video_title: form.theory_video_title || null,
      }
      if (hasPageImgs) body.page_images = pageImages

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
    })
    setPageImages(ws.page_images || [])
    const savedObjectives = (ws.objectives || "").split("\n").filter(Boolean)
    setSelectedObjectives(new Set(savedObjectives))
    setUploadedFileName(ws.page_images ? `${ws.pdf_pages} pages` : "")
    setEditingId(ws.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
    setForm({ title: "", grade: "10", week_number: "", topic: "", pdf_url: "", pdf_pages: "1", objectives: "", reference_pdf_url: "", theory_video_url: "", theory_video_title: "", additional_links: "" })
    setSelectedObjectives(new Set())
    setPageImages([])
    setUploadedFileName("")
    setConvertProgress("")
  }

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== "application/pdf") { toast.error("Only PDF files allowed"); return }
    if (file.size > 20 * 1024 * 1024) { toast.error("File too large (max 20MB)"); return }
    setConverting(true)
    setConvertProgress("Loading PDF...")
    setUploadedFileName(file.name)
    setPageImages([])
    try {
      const pdfjsLib = await loadPDFjs()
      const data = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data }).promise
      const totalPages = pdf.numPages
      updateForm({ pdf_pages: String(totalPages) })
      const urls: string[] = []
      for (let i = 1; i <= totalPages; i++) {
        setConvertProgress(`Converting page ${i} of ${totalPages}...`)
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 1.5 })
        const c = document.createElement("canvas")
        c.width = vp.width
        c.height = vp.height
        const ctx = c.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!), "image/jpeg", 0.85))
        const fd = new FormData()
        fd.append("file", blob, `page_${i}.jpg`)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (!res.ok) throw new Error("Image upload failed")
        const d = await res.json()
        urls.push(d.url)
      }
      setPageImages(urls)
      updateForm({ pdf_url: "" })
      setConvertProgress(`${totalPages} pages converted to images`)
      toast.success(`PDF converted to ${totalPages} images — ready for annotation!`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF conversion failed — paste a direct PDF URL below instead")
      setConvertProgress("")
    } finally {
      setConverting(false)
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

            {/* Worksheet — Convert PDF → Page Images */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-blue-600" />
                Worksheet <span className="text-xs font-normal text-muted-foreground">(upload PDF → convert to images → annotation canvas)</span>
              </h3>
              <div className="space-y-2">
                <Label>Upload PDF *</Label>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={converting}>
                    {converting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    {converting ? "Converting..." : "Choose PDF"}
                  </Button>
                  <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFilePick} />
                  {uploadedFileName && !converting && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" /> {uploadedFileName}
                      <button type="button" onClick={() => { setPageImages([]); setUploadedFileName(""); setConvertProgress(""); updateForm({ pdf_url: "" }) }}
                        className="ml-1 text-red-500 hover:text-red-700 font-medium">✕</button>
                    </span>
                  )}
                  {convertProgress && (
                    <span className="text-xs text-muted-foreground">{convertProgress}</span>
                  )}
                </div>
              </div>

              {pageImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Page previews ({pageImages.length} pages)</Label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {pageImages.map((url, i) => (
                      <div key={i} className="shrink-0 w-20 h-28 rounded border overflow-hidden bg-gray-100 relative">
                        <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Pages</Label>
                  <Input type="number" min={1} max={50} value={form.pdf_pages}
                    onChange={e => updateForm({ pdf_pages: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Paste PDF URL (fallback) <span className="text-xs text-muted-foreground">(Google Drive, direct link — no annotation drawing, only text answers)</span></Label>
                  <Input value={form.pdf_url} onChange={e => updateForm({ pdf_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/... or https://example.com/file.pdf" />
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

            <Button onClick={handleSave} disabled={saving || converting}>
              {(saving || converting) && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : converting ? "Converting..." : editingId ? "Update Worksheet" : "Save Worksheet"}
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
                  <div className="flex flex-wrap gap-1 mb-2">
                    {ws.page_images && <Badge variant="outline" className="text-[10px]">🖼️ Canvas Ready</Badge>}
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
