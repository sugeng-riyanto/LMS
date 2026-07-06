"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Eye, Send, CheckCircle, FileText } from "lucide-react"
import { TPA_CATEGORIES, calculateTotal, getGradeLabel } from "@/tpa/rubric"
import toast from "react-hot-toast"

interface Supervision {
  id: string; teacher_id: string; grade: number; subject: string; class_name: string | null
  observation_date: string; status: string
  principal_signature: string | null; teacher_signature: string | null
  teacher: { id: string; full_name: string }
}

const SUBJECTS = [{ code: "PHY", name: "Physics" }, { code: "MAT", name: "Mathematics" }, { code: "CHE", name: "Chemistry" }, { code: "BIO", name: "Biology" }, { code: "ECO", name: "Economics" }]

export default function SupervisionsPage() {
  const { profile } = useAuth()
  const { isPrincipal, isTeacher, isSuperAdmin } = useRBAC()
  const [items, setItems] = useState<Supervision[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Supervision | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Supervision | null>(null)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({})
  const [saving, setSaving] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")

  // AI feedback generator
  function generateFeedback() {
    if (!computedTotals) return ""
    const strengths: string[] = []; const improvements: string[] = []
    for (const d of computedTotals.details) {
      const pct = d.max > 0 ? Math.round((d.raw / d.max) * 100) : 0
      if (pct >= 80) strengths.push(`${d.label} (${pct}%)`)
      else if (pct < 60) improvements.push(`${d.label} (${pct}%)`)
    }
    const lines: string[] = []
    if (strengths.length > 0) lines.push(`Strengths: ${strengths.join(", ")}.`)
    if (improvements.length > 0) lines.push(`Areas for improvement: ${improvements.join(", ")}.`)
    else lines.push("Overall performance meets expectations across all areas.")
    lines.push(`Total: ${computedTotals.total.toFixed(1)}% — ${getGradeLabel(computedTotals.total)}.`)
    if (computedTotals.total >= 90) lines.push("Exceptional. Maintain high standards.")
    else if (computedTotals.total >= 80) lines.push("Very good. Minor refinements will enhance effectiveness.")
    else if (computedTotals.total >= 70) lines.push("Satisfactory. Focus on targeted professional growth.")
    else if (computedTotals.total >= 60) lines.push("Developing. A professional development plan is recommended.")
    else lines.push("Unsatisfactory. Immediate support is required.")
    setAiFeedback(lines.join("\n"))
  }

  const [form, setForm] = useState({ teacher_id: "", grade: "10", subject: "PHY", class_name: "", observation_date: new Date().toISOString().split("T")[0] })

  useEffect(() => { if (isPrincipal || isSuperAdmin) fetchTeachers() }, [])
  useEffect(() => { fetchItems() }, [])

  async function fetchTeachers() {
    try { const r = await fetch("/api/profiles?role=teacher"); if (r.ok) setTeachers(await r.json()) } catch {}
  }
  async function fetchItems() {
    setLoading(true)
    try { const r = await fetch("/api/supervisions"); if (r.ok) setItems(await r.json()) } catch {}
    finally { setLoading(false) }
  }

  function initScores() {
    const s: Record<string, Record<string, number>> = {}
    for (const cat of TPA_CATEGORIES) { s[cat.key] = {}; cat.items.forEach(item => { s[cat.key][item.id] = 4 }) }
    return s
  }

  function openNew() { setEditing(null); setScores(initScores()); setCreateOpen(true) }
  function openEdit(sup: Supervision) {
    setEditing(sup as any); setScores(initScores())
    setForm({ teacher_id: sup.teacher_id, grade: String(sup.grade), subject: sup.subject, class_name: sup.class_name || "", observation_date: sup.observation_date?.split("T")[0] || "" })
    setCreateOpen(true)
  }

  function setScore(catKey: string, itemId: number, val: number) {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [itemId]: val } }))
  }

  const computedTotals = useMemo(() => {
    const catScores: Record<string, { raw: number; max: number }> = {}
    for (const cat of TPA_CATEGORIES) {
      const s = scores[cat.key] || {}; const raw = cat.items.reduce((sum, item) => sum + (s[item.id] ?? 4), 0)
      catScores[cat.key] = { raw, max: cat.items.length * 4 }
    }
    return { total: calculateTotal(catScores), details: TPA_CATEGORIES.map(c => ({ ...c, raw: catScores[c.key]?.raw ?? 0, max: catScores[c.key]?.max ?? 1 })) }
  }, [scores])

  async function handleSave(submit: boolean) {
    if (!form.teacher_id) { toast.error("Select a teacher"); return }
    setSaving(true)
    try {
      const body = { teacher_id: form.teacher_id, grade: parseInt(form.grade), subject: form.subject, class_name: form.class_name || null, observation_date: form.observation_date }
      if (submit) {
        const url = editing?.id ? `/api/supervisions/${editing.id}` : "/api/supervisions"
        const method = editing?.id ? "PUT" : "POST"
        const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        if (r.ok) {
          const data = editing?.id ? null : await r.json()
          if (data) await fetch(`/api/supervisions/${data.id}/publish`, { method: "POST" })
          toast.success(submit ? "Published!" : "Saved!"); setCreateOpen(false); fetchItems()
        } else toast.error("Failed")
      } else {
        const url = editing?.id ? `/api/supervisions/${editing.id}` : "/api/supervisions"
        const method = editing?.id ? "PUT" : "POST"
        const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        if (r.ok) { toast.success("Saved!"); setCreateOpen(false); fetchItems() } else toast.error("Failed")
      }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  async function handlePublish(s: Supervision) {
    try { const r = await fetch(`/api/supervisions/${s.id}/publish`, { method: "POST" }); if (r.ok) { toast.success("Published!"); fetchItems() } } catch {}
  }
  async function handleSign() {
    if (!viewing || viewing.status !== "published") return
    try {
      const r = await fetch(`/api/supervisions/${viewing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_signature: `Signed by ${profile?.full_name}` }) })
      if (r.ok) { toast.success("Signed!"); setViewing(null); fetchItems() } else toast.error("Failed")
    } catch { toast.error("Failed") }
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { draft: "bg-amber-100 text-amber-700", published: "bg-blue-100 text-blue-700", acknowledged: "bg-green-100 text-green-700" }
    return <Badge className={m[s] || ""}>{s}</Badge>
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Supervisions</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{isPrincipal ? "Observe teachers using the SHB rubric (85 criteria, default score 4)." : "View your supervision results."}</p>
        </div>
        {(isPrincipal || isSuperAdmin) && <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> New</Button>}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No supervisions yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold">{s.teacher?.full_name}</span>
                  <Badge variant="outline" className="text-[10px]">G{s.grade} {s.subject}</Badge>
                  {s.class_name && <Badge variant="secondary" className="text-[10px]">{s.class_name}</Badge>}
                  {statusBadge(s.status)}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(s.observation_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                {(isPrincipal || isSuperAdmin) && <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openEdit(s)}><FileText className="h-3 w-3 mr-1" />Edit</Button>}
                {isTeacher && s.status === "published" && <Button size="sm" className="h-7 text-xs" onClick={() => setViewing(s)}><CheckCircle className="h-3 w-3 mr-1" />Sign</Button>}
                {s.status === "draft" && (isPrincipal || isSuperAdmin) && <Button size="sm" className="h-7 text-xs" onClick={() => handlePublish(s)}><Send className="h-3 w-3 mr-1" />Publish</Button>}
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setViewing(s)}><Eye className="h-3 w-3 mr-1" />View</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Scoring Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[85vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-base">{editing ? "Edit" : "New"} Supervision — Full Rubric</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="space-y-1"><Label className="text-[11px]">Teacher</Label>
                <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2" disabled={!!editing}>
                  <option value="">Select...</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select></div>
              <div className="space-y-1"><Label className="text-[11px]">Grade</Label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                  {[7,8,9,10,11,12].map(g => <option key={g} value={g}>G{g}</option>)}</select></div>
              <div className="space-y-1"><Label className="text-[11px]">Subject</Label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full h-8 text-xs rounded-md border border-input bg-background px-2">
                  {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}</select></div>
              <div className="space-y-1"><Label className="text-[11px]">Class</Label>
                <input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder="A" className="w-full h-8 text-xs rounded-md border border-input bg-background px-2" /></div>
            </div>
            <div className="flex gap-2 items-center">
              <Label className="text-[11px] shrink-0">Date</Label>
              <input type="date" value={form.observation_date} onChange={e => setForm(p => ({ ...p, observation_date: e.target.value }))} className="h-8 text-xs rounded-md border border-input bg-background px-2" />
            </div>

            <Separator />
            <p className="text-[11px] text-muted-foreground">Rate 0-4. Slider or click number. Default: <strong>4</strong> (All of the time).</p>

            {/* Compact rubric */}
            {TPA_CATEGORIES.map(cat => {
              const catScores = scores[cat.key] || {}
              const raw = cat.items.reduce((sum, item) => sum + (catScores[item.id] ?? 4), 0)
              const max = cat.items.length * 4
              return (
                <div key={cat.key} className="border-b border-border pb-2 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-xs sm:text-sm">{cat.label} <span className="text-muted-foreground font-normal">({cat.weight}%)</span></h3>
                    <span className="text-[10px] text-muted-foreground">{raw}/{max} · {max > 0 ? Math.round((raw / max) * 100) : 0}%</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {cat.items.map(item => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-1 py-1">
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex-1 min-w-0">{item.id}. {item.text}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input type="range" min={0} max={4} step={1} value={catScores[item.id] ?? 4}
                            onChange={e => setScore(cat.key, item.id, parseInt(e.target.value))}
                            className="w-14 sm:w-20 h-1 rounded-full appearance-none bg-muted accent-primary cursor-pointer" />
                          <span className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold ${(catScores[item.id] ?? 4) >= 3 ? 'bg-green-100 text-green-700' : (catScores[item.id] ?? 4) >= 2 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {catScores[item.id] ?? 4}
                          </span>
                          <div className="flex gap-px">
                            {[0,1,2,3,4].map(v => (
                              <button key={v} type="button" onClick={() => setScore(cat.key, item.id, v)}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm text-[7px] sm:text-[9px] font-medium transition-all ${(catScores[item.id] ?? 4) === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{v}</button>
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
              <div className="rounded-lg border border-border bg-muted/30 p-3">
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
                  <Badge className={`text-[10px] ${computedTotals.total >= 90 ? 'bg-green-100 text-green-700' : computedTotals.total >= 80 ? 'bg-blue-100 text-blue-700' : computedTotals.total >= 70 ? 'bg-amber-100 text-amber-700' : computedTotals.total >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                    {getGradeLabel(computedTotals.total)}
                  </Badge>
                </div>
              </div>
            )}

            {/* AI-Generated Feedback */}
            {computedTotals && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold">AI Feedback</h3>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={generateFeedback}>
                    Generate
                  </Button>
                </div>
                {aiFeedback && (
                  <textarea readOnly value={aiFeedback} rows={4}
                    className="w-full text-[11px] text-foreground bg-background rounded border border-border p-2 resize-none" />
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button size="sm" variant="outline" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
              <Button size="sm" onClick={() => handleSave(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                <Send className="mr-1 h-3 w-3" /> Submit & Publish
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Supervision Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-2 text-sm">
              <p><strong>Teacher:</strong> {viewing.teacher?.full_name}</p>
              <p><strong>Class:</strong> G{viewing.grade} {viewing.subject} {viewing.class_name}</p>
              <p><strong>Date:</strong> {new Date(viewing.observation_date).toLocaleDateString()}</p>
              <p><strong>Status:</strong> {statusBadge(viewing.status)}</p>
              <Separator />
              {viewing.principal_signature && <p className="text-xs text-green-600">✓ Principal: {viewing.principal_signature}</p>}
              {viewing.teacher_signature && <p className="text-xs text-blue-600">✓ Teacher: {viewing.teacher_signature}</p>}
              {isTeacher && viewing.status === "published" && (
                <Button className="w-full mt-2" size="sm" onClick={handleSign}><CheckCircle className="mr-1 h-3 w-3" /> Sign & Acknowledge</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
