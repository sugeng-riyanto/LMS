"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Eye, Send, CheckCircle, Trash2, FileSpreadsheet, RotateCcw, Pen, BarChart3 } from "lucide-react"
import SignatureCanvas from "@/components/SignatureCanvas"
import VisualizationDashboard from "@/components/VisualizationDashboard"
import { TPA_CATEGORIES, SCORE_COLORS, calculateTotal, getGradeLabel, GRADE_INTERPRETATION } from "@/tpa/rubric"
import toast from "react-hot-toast"

interface TPARecord {
  id: string; teacher_id: string; principal_id: string
  academic_year: string; semester: number; period_type: string; period_label: string | null
  subject: string | null; grade: number | null; class_name: string | null
  principal_scores: any; principal_total: number | null; principal_submitted_at: string | null
  teacher_scores: any; teacher_total: number | null; teacher_submitted_at: string | null
  combined_total: number | null; combined_grade: string | null; status: string
  principal_signature: string | null; teacher_signature: string | null
  pre_appraisal_held: boolean; post_conference_held: boolean; visit_count: number
  teacher: { id: string; full_name: string }
  created_at: string
}

import { useSubjects } from "@/hooks/use-subjects"
import { parseScale } from "@/lib/utils/scale"
const PERIOD_TYPES = [{ value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "semester", label: "Semester" }]

export default function TPAPage() {
  const { profile } = useAuth()
  const { isPrincipal, isTeacher, isSuperAdmin } = useRBAC()
  const { subjects: allSubjects } = useSubjects()
  const [items, setItems] = useState<TPARecord[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<TPARecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingScores, setEditingScores] = useState<TPARecord | null>(null)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({})
  const [saving, setSaving] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [accumulations, setAccumulations] = useState<any>(null)
  const [availableGrades, setAvailableGrades] = useState<number[]>([7, 8, 9, 10, 11, 12])
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([])
  const [principalTpaSig, setPrincipalTpaSig] = useState<string | null>(null)
  const [teacherTpaSig, setTeacherTpaSig] = useState<string | null>(null)
  const [weightDialog, setWeightDialog] = useState(false)
  const [weightVal, setWeightVal] = useState(70)
  const [scaleVal, setScaleVal] = useState("0-4")

  useEffect(() => {
    if (isPrincipal) {
      fetch("/api/principal/level").then(r => r.json()).then(d => {
        if (d.level === "JHS") setAvailableGrades([7, 8, 9])
        else if (d.level === "SHS") setAvailableGrades([10, 11, 12])
      }).catch(() => {})
    }
  }, [isPrincipal])

  // Toggle select for bulk publish
  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }
  function selectAll() { setSelected(new Set(items.filter(i => i.status === "draft").map(i => i.id))) }
  function deselectAll() { setSelected(new Set()) }

  // Bulk publish: submit selected drafts with average score
  async function handleBulkPublish() {
    if (selected.size === 0) { toast.error("Select items to publish"); return }
    if (!confirm(`Publish ${selected.size} assessment(s) to teachers?`)) return
    setSaving(true)
    let success = 0, fail = 0
    for (const id of selected) {
      try {
        const r = await fetch(`/api/tpa/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish" }) })
        if (r.ok) success++; else fail++
      } catch { fail++ }
    }
    toast.success(`${success} published, ${fail} failed`)
    setSelected(new Set()); setSaving(false); fetchItems()
  }

  // AI-generated feedback based on scores
  function generateFeedback() {
    if (!computedTotals) return ""
    const lines: string[] = []
    const strengths: string[] = []
    const improvements: string[] = []
    for (const d of computedTotals.details) {
      const pct = d.max > 0 ? Math.round((d.raw / d.max) * 100) : 0
      if (pct >= 80) strengths.push(`${d.label} (${pct}%)`)
      else if (pct < 60) improvements.push(`${d.label} (${pct}%)`)
    }
    if (strengths.length > 0) lines.push(`Strengths: ${strengths.join(", ")}.`)
    if (improvements.length > 0) lines.push(`Areas for improvement: ${improvements.join(", ")}.`)
    else lines.push("Overall performance meets expectations across all areas.")
    lines.push(`Combined weighted score: ${computedTotals.total.toFixed(1)}% — ${getGradeLabel(computedTotals.total)}.`)
    if (computedTotals.total >= 90) lines.push("Exceptional performance. Continue to maintain high standards.")
    else if (computedTotals.total >= 80) lines.push("Very good performance. Minor refinements will further enhance teaching effectiveness.")
    else if (computedTotals.total >= 70) lines.push("Satisfactory performance. Focus on targeted areas for professional growth.")
    else if (computedTotals.total >= 60) lines.push("Developing performance. A professional development plan is recommended.")
    else lines.push("Unsatisfactory performance. Immediate intervention and support are required.")
    return lines.join("\n")
  }

  function handleGenerateFeedback() {
    setAiFeedback(generateFeedback())
  }
  const [periodFilter, setPeriodFilter] = useState("all")

  const [form, setForm] = useState({
    teacher_id: "", semester: "1", subject: "PHY", grade: "7", class_name: "",
    period_type: "monthly", period_label: "",
  })

  useEffect(() => { if (isPrincipal || isSuperAdmin) fetchTeachers() }, [isPrincipal, isSuperAdmin, availableGrades])
  useEffect(() => { fetchItems() }, [periodFilter])

  function teacherDisplayName(a: any): string {
    return `${a.profiles?.full_name ?? "Unknown"} — G${a.grade} ${a.subject}${a.classes?.class_name ? " (" + a.classes.class_name + ")" : ""}`
  }

  async function fetchTeachers() {
    try {
      const r = await fetch("/api/profiles?role=teacher")
      if (!r.ok) return
      let teachers: any[] = await r.json()

      try {
        const taR = await fetch("/api/teacher-assignments")
        if (taR.ok) {
          const ta: any[] = await taR.json()
          const gradeFiltered = ta.filter((a: any) => availableGrades.includes(a.grade))
          setTeacherAssignments(gradeFiltered)
          const assignedIds = new Set(gradeFiltered.map((a: any) => a.teacher_id))
          if (assignedIds.size > 0) {
            teachers = teachers.filter((p: any) => assignedIds.has(p.id))
          }
        }
      } catch {}

      try {
        const mR = await fetch("/api/principal/mappings")
        if (mR.ok) {
          const allMappings: any[] = await mR.json()
          const meR = await fetch("/api/profiles/me")
          if (meR.ok) {
            const me = await meR.json()
            const myMappings = allMappings.filter((m: any) => m.principal_id === me.id)
            if (myMappings.length > 0) {
              const mappingIds = new Set(myMappings.map((m: any) => m.teacher_id))
              teachers = teachers.filter((p: any) => mappingIds.has(p.id))
            }
          }
        }
      } catch {}

      setTeachers(teachers)
    } catch {}
  }
  async function fetchItems() {
    setLoading(true)
    try {
      const pf = periodFilter !== "all" ? `&period_type=${periodFilter}` : ""
      const r = await fetch(`/api/tpa${pf}`)
      if (r.ok) setItems(await r.json())
    } catch {}
    finally { setLoading(false) }
  }

  function getDefaultPeriodLabel(type: string): string {
    const now = new Date()
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const q = Math.ceil((now.getMonth() + 1) / 3)
    if (type === "monthly") return `${months[now.getMonth()]} ${now.getFullYear()}`
    if (type === "quarterly") return `Q${q} ${now.getFullYear()}`
    return `Semester ${form.semester} 2026-2027`
  }

  async function handleCreate() {
    if (!form.teacher_id) { toast.error("Select a teacher"); return }
    setSaving(true)
    try {
      const r = await fetch("/api/tpa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: form.teacher_id, semester: parseInt(form.semester),
          subject: form.subject, grade: parseInt(form.grade), class_name: form.class_name || null,
          period_type: form.period_type,
          period_label: form.period_label || getDefaultPeriodLabel(form.period_type),
        }),
      })
      if (r.ok) { toast.success("Created!"); setCreateOpen(false); fetchItems() }
      else { const e = await r.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  function openScores(tpa: TPARecord) {
    const isP = isPrincipal || isSuperAdmin
    const existing = isP ? tpa.principal_scores : tpa.teacher_scores
    const s: Record<string, Record<string, number>> = {}
    if (existing) {
      for (const cat of TPA_CATEGORIES) s[cat.key] = existing[cat.key] || {}
    } else {
      for (const cat of TPA_CATEGORIES) {
        s[cat.key] = {}
        cat.items.forEach(item => { s[cat.key][item.id] = 3 })
      }
    }
    setScores(s)
    setEditingScores(tpa)
  }

  function setScore(catKey: string, itemId: number, val: number) {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [itemId]: val } }))
  }

  const computedTotals = useMemo(() => {
    if (!editingScores) return null
    const catScores: Record<string, { raw: number; max: number }> = {}
    for (const cat of TPA_CATEGORIES) {
      const s = scores[cat.key] || {}
      const raw = cat.items.reduce((sum, item) => sum + (s[item.id] ?? 3), 0)
      catScores[cat.key] = { raw, max: cat.items.length * 4 }
    }
    return { catScores, total: calculateTotal(catScores), details: TPA_CATEGORIES.map(c => ({ ...c, raw: catScores[c.key]?.raw ?? 0, max: catScores[c.key]?.max ?? 1 })) }
  }, [scores, editingScores])

  async function handleSaveScores(submit: boolean) {
    if (!editingScores) return
    setSaving(true)
    try {
      const isP = isPrincipal || isSuperAdmin
      const body: any = {}
      if (submit) {
        body.action = isP ? "publish" : "submit"
        if (isP) body.principal_scores = scores
        else body.teacher_scores = scores
      } else {
        if (isP) body.principal_scores = scores
        else body.teacher_scores = scores
      }
      if (isP && principalTpaSig) body.signature_data_url = principalTpaSig
      if (!isP && teacherTpaSig) body.signature_data_url = teacherTpaSig
      const r = await fetch(`/api/tpa/${editingScores.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (r.ok) {
        toast.success(submit ? "Submitted!" : "Saved!"); setEditingScores(null); fetchItems()
        // Refresh accumulations if visible
        try {
          const accR = await fetch("/api/tpa/accumulations")
          if (accR.ok) setAccumulations(await accR.json())
        } catch {}
      }
      else { const e = await r.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  async function handleUnpublish(tpa: TPARecord) {
    if (!confirm("Unpublish? Teacher will lose access.")) return
    try {
      const r = await fetch(`/api/tpa/${tpa.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unpublish" }) })
      if (r.ok) { toast.success("Unpublished"); fetchItems() }
      else toast.error("Failed")
    } catch { toast.error("Failed") }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: "bg-amber-100 text-amber-700", principal_submitted: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" }
    return <Badge className={map[s] || ""}>{s.replace(/_/g, " ")}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Performance Assessment</h1>
          <p className="text-muted-foreground">{isPrincipal ? "Evaluate teachers using the SHB rubric. Auto-calculated weighted scores." : "View your assessments and submit self-evaluation."}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs">
            <option value="all">All Periods</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="semester">Semester</option>
          </select>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`/api/export/tpa?format=xlsx&period_type=${periodFilter}`, "_blank")} title="Download XLSX">
              📊 XLSX
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`/api/export/tpa?format=pdf&period_type=${periodFilter}`, "_blank")} title="Download PDF">
              📄 PDF
            </Button>
          </div>
          {(isPrincipal || isSuperAdmin) && <Button size="sm" className="h-8 text-xs" onClick={() => { fetchTeachers(); setForm(p => ({ ...p, grade: String(availableGrades[0] ?? 7) })); setCreateOpen(true) }}><Plus className="mr-1 h-4 w-4" /> New</Button>}
          {(isPrincipal || isSuperAdmin) && <Button size="sm" variant="outline" className="h-8 text-xs" onClick={async () => {
            setLoading(true)
            try {
              const r = await fetch("/api/tpa/accumulations")
              if (r.ok) { const data = await r.json(); setAccumulations(data); if (data.weights?.scale) setScaleVal(data.weights.scale) }
              else toast.error("Failed to load")
            } catch { toast.error("Failed") }
            finally { setLoading(false) }
          }}><BarChart3 className="mr-1 h-4 w-4" />Accumulations</Button>}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <div className="space-y-2">
          <div className="py-8 text-center text-sm text-muted-foreground">No assessments yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Bulk actions bar */}
          {(isPrincipal || isSuperAdmin) && items.some(i => i.status === "draft") && (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30 text-xs">
              <button onClick={selectAll} className="text-primary hover:underline">Select All</button>
              <span className="text-muted-foreground">·</span>
              <button onClick={deselectAll} className="text-muted-foreground hover:underline">Clear</button>
              <span className="text-muted-foreground ml-2">{selected.size} selected</span>
              {selected.size > 0 && (
                <Button size="sm" className="h-7 text-xs ml-auto" onClick={handleBulkPublish} disabled={saving}>
                  <Send className="mr-1 h-3 w-3" /> Publish ({selected.size})
                </Button>
              )}
            </div>
          )}
          {items.map((tpa) => (
            <div key={tpa.id} className="flex items-center gap-2 py-2 border-b border-border last:border-0">
              {/* Checkbox for bulk */}
              {(isPrincipal || isSuperAdmin) && tpa.status === "draft" && (
                <input type="checkbox" checked={selected.has(tpa.id)} onChange={() => toggleSelect(tpa.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold">{tpa.teacher?.full_name}</span>
                      {tpa.grade && <Badge variant="outline" className="text-xs">G{tpa.grade}</Badge>}
                      {tpa.subject && <Badge variant="secondary" className="text-xs">{tpa.subject}</Badge>}
                      {statusBadge(tpa.status)}
                      <Badge variant="outline" className="text-xs">{tpa.period_label || `${tpa.period_type} ${tpa.semester}`}</Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {tpa.principal_total != null && <span>Principal: <strong className={tpa.principal_total >= 60 ? "text-green-600" : "text-red-600"}>{tpa.principal_total.toFixed(1)}%</strong></span>}
                      {tpa.teacher_total != null && <span>Teacher: <strong className={tpa.teacher_total >= 60 ? "text-green-600" : "text-red-600"}>{tpa.teacher_total.toFixed(1)}%</strong></span>}
                      {tpa.combined_total != null && <span>Combined: <strong className="text-primary">{tpa.combined_total.toFixed(1)}%</strong> <Badge variant="outline" className="text-size-xs">{tpa.combined_grade}</Badge></span>}
                      {tpa.principal_signature && <span className="text-green-600 text-size-xs">✓ P-signed</span>}
                      {tpa.teacher_signature && <span className="text-blue-600 text-size-xs">✓ T-signed</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0 flex-wrap">
                    {(isPrincipal || isSuperAdmin) && tpa.status === "draft" && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => openScores(tpa)}>
                        <FileSpreadsheet className="mr-1 h-3 w-3" /> Fill Scores
                      </Button>
                    )}
                    {(isPrincipal || isSuperAdmin) && tpa.status === "principal_submitted" && (
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleUnpublish(tpa)}>
                        <RotateCcw className="mr-1 h-3 w-3" /> Unpublish
                      </Button>
                    )}
                    {(isPrincipal || isSuperAdmin) && ["principal_submitted", "completed"].includes(tpa.status) && (
                      <Button variant="ghost" size="icon" onClick={() => setViewing(tpa)} title="View"><Eye className="h-4 w-4" /></Button>
                    )}
                    {isTeacher && tpa.status === "principal_submitted" && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => openScores(tpa)}>
                        <FileSpreadsheet className="mr-1 h-3 w-3" /> Self-Assessment
                      </Button>
                    )}
                    {isTeacher && tpa.status !== "principal_submitted" && (
                      <Button variant="ghost" size="icon" onClick={() => setViewing(tpa)} title="View"><Eye className="h-4 w-4" /></Button>
                    )}
                    {(isPrincipal || isSuperAdmin) && tpa.status === "draft" && (
                      <Button variant="ghost" size="icon" onClick={async () => { if (!confirm("Delete?")) return; await fetch(`/api/tpa/${tpa.id}`, { method: "DELETE" }); fetchItems() }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Assessment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Teacher *</Label>
              <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="">Select...</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Period</Label>
                <select value={form.period_type} onChange={e => setForm(p => ({ ...p, period_type: e.target.value, period_label: "" }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">{PERIOD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
              <div className="space-y-1"><Label>Semester</Label>
                <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="1">1</option><option value="2">2</option></select></div>
              <div className="space-y-1"><Label>Label</Label>
                <Input value={form.period_label || getDefaultPeriodLabel(form.period_type)} onChange={e => setForm(p => ({ ...p, period_label: e.target.value }))} placeholder="Auto" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Grade</Label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">{availableGrades.map(g => <option key={g} value={g}>G{g}</option>)}</select></div>
              <div className="space-y-1"><Label>Subject</Label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">{allSubjects.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}</select></div>
              <div className="space-y-1"><Label>Class</Label>
                <input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder="A" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scores Dialog — compact responsive rubric */}
      <Dialog open={!!editingScores} onOpenChange={(o) => { if (!o) setEditingScores(null) }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base">{editingScores?.teacher?.full_name} — {(isPrincipal || isSuperAdmin) ? "Principal Assessment" : "Self-Assessment"}</DialogTitle>
            <p className="text-xs text-muted-foreground">{editingScores?.period_label}</p>
          </DialogHeader>
          {editingScores && (
            <div className="space-y-4">
              {/* Compact rubric grid */}
              {TPA_CATEGORIES.map(cat => {
                const catScores = scores[cat.key] || {}
                const raw = cat.items.reduce((sum, item) => sum + (catScores[item.id] ?? 0), 0)
                const max = cat.items.length * 4
                const pct = max > 0 ? Math.round((raw / max) * 100) : 0
                return (
                  <div key={cat.key} className="border-b border-border pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-xs sm:text-sm">{cat.label} <span className="text-muted-foreground font-normal">({cat.weight}%)</span></h3>
                      <span className="text-size-xs sm:text-xs text-muted-foreground">{raw}/{max} · {pct}%</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {cat.items.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm sm:text-base text-foreground leading-snug flex-1 min-w-0 font-medium">{item.id}. {item.text}</span>
                          <div className="flex items-center gap-3 shrink-0">
                            <input type="range" min={scale.min} max={scale.max} step={1}
                              value={catScores[item.id] ?? 3}
                              onChange={e => setScore(cat.key, item.id, parseInt(e.target.value))}
                              className="w-28 sm:w-36 h-3 rounded-full appearance-none bg-muted accent-primary cursor-pointer touch-pan-y" />
                            <span className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-base sm:text-lg font-bold shadow-sm ${(catScores[item.id] ?? 3) >= 3 ? 'bg-green-100 text-green-700 border border-green-300' : (catScores[item.id] ?? 3) >= 2 ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-red-100 text-red-700 border border-red-300'}`}>
                              {catScores[item.id] ?? 3}
                            </span>
                            <div className="flex gap-1 flex-wrap">
                              {parseScale(scaleVal).values.map(v => (
                                <button key={v} type="button" onClick={() => setScore(cat.key, item.id, v)}
                                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg text-xs sm:text-sm font-bold transition-all active:scale-90 touch-manipulation shadow-sm ${(catScores[item.id] ?? Math.ceil(parseScale(scaleVal).max / 2)) === v ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30' : 'bg-card text-foreground hover:bg-accent border border-border'}`}>{v}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Compact results */}
              {computedTotals && (
                <div className="py-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 mb-2">
                    {computedTotals.details.map(d => (
                      <div key={d.key} className="text-center">
                        <p className="text-[9px] text-muted-foreground truncate">{d.label}</p>
                        <p className="text-xs font-bold">{d.max > 0 ? ((d.raw / d.max) * d.weight).toFixed(1) : "0"}%</p>
                        <div className="h-1 rounded-full bg-muted mt-0.5 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${d.max > 0 ? (d.raw / d.max) * 100 : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-bold">Total: {computedTotals.total.toFixed(1)}%</span>
                    <Badge className={`text-size-xs ${computedTotals.total >= 90 ? 'bg-green-100 text-green-700' : computedTotals.total >= 80 ? 'bg-blue-100 text-blue-700' : computedTotals.total >= 70 ? 'bg-amber-100 text-amber-700' : computedTotals.total >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {getGradeLabel(computedTotals.total)}
                    </Badge>
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              {computedTotals && (
                <div className="py-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-semibold">AI Feedback</h3>
                    <Button size="sm" variant="outline" className="h-6 text-size-xs px-2" onClick={handleGenerateFeedback}>
                      Generate
                    </Button>
                  </div>
                  {aiFeedback && (
                    <textarea readOnly value={aiFeedback} rows={3}
                      className="w-full text-size-sm text-foreground bg-background rounded border border-border p-2 resize-none" />
                  )}
                </div>
              )}

              {/* Signature */}
              {(isPrincipal || isSuperAdmin) && editingScores.status === "draft" && (
                <SignatureCanvas onSave={setPrincipalTpaSig} savedSig={principalTpaSig} label="Principal Signature (draw below)" />
              )}
              {isTeacher && editingScores.status === "principal_submitted" && (
                <SignatureCanvas onSave={setTeacherTpaSig} savedSig={teacherTpaSig} label="Teacher Signature (draw below)" />
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                <div className="flex gap-2">
                  {(isPrincipal || isSuperAdmin) && editingScores.status === "draft" && (
                    <Button size="sm" variant="outline" onClick={() => handleSaveScores(false)} disabled={saving}>Save Draft</Button>
                  )}
                  {(isPrincipal || isSuperAdmin) && editingScores.status !== "draft" && (
                    <Button size="sm" variant="outline" onClick={() => setEditingScores(null)}>Close</Button>
                  )}
                </div>
                {(isPrincipal || isSuperAdmin) && editingScores.status === "draft" && computedTotals && (
                  <Button size="sm" onClick={() => handleSaveScores(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                    <Send className="mr-1 h-3 w-3" /> Publish
                  </Button>
                )}
                {isTeacher && editingScores.status === "principal_submitted" && computedTotals && (
                  <Button size="sm" onClick={() => handleSaveScores(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="mr-1 h-3 w-3" /> Submit Self-Assessment
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accumulations */}
      {accumulations && accumulations.teachers?.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Teacher Score Accumulation</CardTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1.5">
                  P:<strong className="text-blue-600">{accumulations.weights.principal}%</strong>
                  T:<strong className="text-green-600">{accumulations.weights.teacher}%</strong>
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setWeightVal(accumulations.weights.principal); setScaleVal(accumulations.weights.scale || "0-4"); setWeightDialog(true) }}>
                  ⚙️ Weights
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAccumulations(null)}>✕ Close</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {accumulations.teachers.map((t: any) => (
              <div key={t.teacher_id} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{t.teacher_name}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Assessments: {t.completed}/{t.total_assessments}</span>
                    <span>P-avg: <strong>{t.avg_principal}%</strong></span>
                    <span>T-avg: <strong>{t.avg_teacher}%</strong></span>
                    <span className={`font-bold text-sm ${t.weighted_total >= 80 ? 'text-green-600' : t.weighted_total >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      Weighted: {t.weighted_total}%
                    </span>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Period</TableHead>
                      <TableHead className="text-[10px]">Grade</TableHead>
                      <TableHead className="text-[10px]">Subject</TableHead>
                      <TableHead className="text-[10px]">Principal</TableHead>
                      <TableHead className="text-[10px]">Teacher</TableHead>
                      <TableHead className="text-[10px]">Combined</TableHead>
                      <TableHead className="text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {t.assessments.map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-xs">{a.period}</TableCell>
                        <TableCell className="text-xs">{a.grade ? `G${a.grade}` : "—"}</TableCell>
                        <TableCell className="text-xs">{a.subject || "—"}</TableCell>
                        <TableCell className="text-xs">{a.principal_score != null ? `${a.principal_score}%` : "—"}</TableCell>
                        <TableCell className="text-xs">{a.teacher_score != null ? `${a.teacher_score}%` : "—"}</TableCell>
                        <TableCell className="text-xs font-bold">{a.combined != null ? `${a.combined}%` : "—"}</TableCell>
                        <TableCell className="text-xs">{a.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weight Settings Dialog — Full CRUD */}
      <Dialog open={weightDialog} onOpenChange={setWeightDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>⚙️ Weight Settings (CRUD)</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Set the weight split between principal and teacher assessment. Total = 100%.</p>

            {/* READ: Current value display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 p-3 text-center">
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-semibold">Principal</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{weightVal}%</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3 text-center">
                <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-semibold">Teacher</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{100 - weightVal}%</p>
              </div>
            </div>

            {/* UPDATE: Slider */}
            <div className="space-y-2">
              <Label className="text-xs">Adjust Principal Weight (slider)</Label>
              <input type="range" min={0} max={100} value={weightVal} onChange={e => setWeightVal(Number(e.target.value))} className="w-full h-2 accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground"><span>0% (teacher only)</span><span>100% (principal only)</span></div>
            </div>

            <div className="rounded-lg bg-muted p-3 text-xs">
              <p><strong>Formula:</strong> Combined = Principal × <strong>{weightVal}%</strong> + Teacher × <strong>{100 - weightVal}%</strong></p>
            </div>

            {/* Assessment Scale */}
            <div className="space-y-1">
              <Label className="text-xs">Assessment Scale</Label>
              <select value={scaleVal} onChange={e => setScaleVal(e.target.value)} className="w-full h-8 rounded border border-input bg-background px-2 text-sm">
                <option value="0-4">Scale 0 - 4 (standard)</option>
                <option value="1-5">Scale 1 - 5</option>
                <option value="0-10">Scale 0 - 10</option>
                <option value="1-10">Scale 1 - 10</option>
              </select>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <div className="flex gap-2">
              {/* DELETE: Reset to defaults */}
              <Button variant="outline" size="sm" onClick={async () => {
                if (!confirm("Reset weights to default (70/30)?")) return
                try {
                  const r = await fetch("/api/settings/tpa-weights", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ principal: 70, teacher: 30 }),
                  })
                  if (r.ok) {
                    setWeightVal(70); toast.success("Reset to defaults"); setWeightDialog(false)
                    try {
                      const accR = await fetch("/api/tpa/accumulations")
                      if (accR.ok) setAccumulations(await accR.json())
                    } catch {}
                  } else { const err = await r.json(); toast.error(err._detail + ": " + err.error) }
                } catch { toast.error("Failed") }
              }}>Reset</Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWeightDialog(false)}>Cancel</Button>
              {/* CREATE / UPDATE */}
              <Button onClick={async () => {
                try {
                  const r = await fetch("/api/settings/tpa-weights", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ principal: weightVal, teacher: 100 - weightVal, scale: scaleVal }),
                  })
                  if (r.ok) {
                    toast.success("Weights saved!")
                    setWeightDialog(false)
                    // Refresh accumulations with new weights
                    try {
                      const accR = await fetch("/api/tpa/accumulations")
                      if (accR.ok) setAccumulations(await accR.json())
                    } catch {}
                  } else { const err = await r.json(); toast.error(err._detail + ": " + err.error) }
                } catch { toast.error("Failed") }
              }}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics */}
      <VisualizationDashboard apiType="tpa" />

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Assessment Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <p><strong>Teacher:</strong> {viewing.teacher?.full_name}</p>
              <p><strong>Period:</strong> {viewing.period_label || `${viewing.period_type} ${viewing.semester}`} · G{viewing.grade} {viewing.subject}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                {viewing.principal_total != null && <div className="rounded-lg border p-2 text-center"><p className="text-xs text-muted-foreground">Principal</p><p className="text-lg font-bold">{viewing.principal_total.toFixed(1)}%</p></div>}
                {viewing.teacher_total != null && <div className="rounded-lg border p-2 text-center"><p className="text-xs text-muted-foreground">Teacher</p><p className="text-lg font-bold">{viewing.teacher_total.toFixed(1)}%</p></div>}
              </div>
              {viewing.combined_total != null && (
                <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Combined Total</p>
                  <p className="text-2xl font-bold text-primary">{viewing.combined_total.toFixed(1)}%</p>
                  <Badge className="mt-1">{viewing.combined_grade}</Badge>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Pre-Appraisal:</strong> {viewing.pre_appraisal_held ? "✅" : "❌"}</div>
                <div><strong>Post Conference:</strong> {viewing.post_conference_held ? "✅" : "❌"}</div>
                <div><strong>Visits:</strong> {viewing.visit_count}</div>
              </div>
              {viewing.principal_signature && (
                <div>
                  <p className="text-green-600 text-xs font-medium">✓ Principal Signed</p>
                  {viewing.principal_signature.startsWith("data:image") ? (
                    <img src={viewing.principal_signature} alt="Principal signature" className="max-w-[180px] h-10 border rounded bg-white" />
                  ) : (
                    <p className="text-green-600 text-xs">{viewing.principal_signature}</p>
                  )}
                </div>
              )}
              {viewing.teacher_signature && (
                <div>
                  <p className="text-blue-600 text-xs font-medium">✓ Teacher Signed</p>
                  {viewing.teacher_signature.startsWith("data:image") ? (
                    <img src={viewing.teacher_signature} alt="Teacher signature" className="max-w-[180px] h-10 border rounded bg-white" />
                  ) : (
                    <p className="text-blue-600 text-xs">{viewing.teacher_signature}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
