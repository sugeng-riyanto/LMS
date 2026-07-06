"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Eye, Send, CheckCircle, Trash2, FileText, RotateCcw } from "lucide-react"
import { TPA_CATEGORIES, SCORE_LABELS, calculateTotal, getGradeLabel, GRADE_INTERPRETATION } from "@/tpa/rubric"
import toast from "react-hot-toast"

interface Supervision {
  id: string; teacher_id: string; grade: number; subject: string; class_name: string | null
  observation_date: string; status: string
  teaching_quality_score: number | null; classroom_management_score: number | null; student_engagement_score: number | null
  notes: string | null; strengths: string | null; areas_for_improvement: string | null
  principal_signature: string | null; teacher_signature: string | null
  principal_signed_at: string | null; teacher_signed_at: string | null
  teacher: { id: string; full_name: string }; created_at: string
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
    for (const cat of TPA_CATEGORIES) {
      s[cat.key] = {}
      cat.items.forEach(item => { s[cat.key][item.id] = 4 })
    }
    return s
  }

  function openNewSupervision() {
    setEditing(null)
    setScores(initScores())
    setCreateOpen(true)
  }

  function openEditSup(sup: Supervision) {
    setEditing(sup as any)
    // Load saved scores or default to 4
    setScores(initScores())
    setForm({ teacher_id: sup.teacher_id, grade: String(sup.grade), subject: sup.subject, class_name: sup.class_name || "", observation_date: sup.observation_date?.split("T")[0] || "" })
    setCreateOpen(true)
  }

  function setScore(catKey: string, itemId: number, val: number) {
    setScores(prev => ({ ...prev, [catKey]: { ...prev[catKey], [itemId]: val } }))
  }

  const computedTotals = useMemo(() => {
    const catScores: Record<string, { raw: number; max: number }> = {}
    for (const cat of TPA_CATEGORIES) {
      const s = scores[cat.key] || {}
      const raw = cat.items.reduce((sum, item) => sum + (s[item.id] ?? 4), 0)
      catScores[cat.key] = { raw, max: cat.items.length * 4 }
    }
    return { total: calculateTotal(catScores), details: TPA_CATEGORIES.map(c => ({ ...c, raw: catScores[c.key]?.raw ?? 0, max: catScores[c.key]?.max ?? 1 })) }
  }, [scores])

  async function handleSave(submit: boolean) {
    if (!form.teacher_id) { toast.error("Select a teacher"); return }
    setSaving(true)
    try {
      if (submit && computedTotals) {
        // Save as supervision with scores
        const body = {
          teacher_id: form.teacher_id, grade: parseInt(form.grade), subject: form.subject,
          class_name: form.class_name || null, observation_date: form.observation_date,
          teaching_quality_score: Math.round(computedTotals.details.find(d => d.key === "instructional")?.raw ?? 0 / 20 * 5),
          classroom_management_score: Math.round(computedTotals.details.find(d => d.key === "classroom")?.raw ?? 0 / 11 * 5),
          student_engagement_score: Math.round(computedTotals.details.find(d => d.key === "instructional")?.raw ?? 0 / 20 * 5),
          notes: `TPA Score: ${computedTotals.total.toFixed(1)}% (${getGradeLabel(computedTotals.total)})`,
        }

        if (editing?.id) {
          const r = await fetch(`/api/supervisions/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          if (r.ok) { toast.success("Updated!"); setCreateOpen(false); fetchItems() }
          else toast.error("Failed")
        } else {
          const r = await fetch("/api/supervisions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          if (r.ok) {
            const data = await r.json()
            // Auto-publish
            await fetch(`/api/supervisions/${data.id}/publish`, { method: "POST" })
            toast.success("Created & published to teacher!")
            setCreateOpen(false); fetchItems()
          } else toast.error("Failed")
        }
      } else {
        // Save as draft
        const body = {
          teacher_id: form.teacher_id, grade: parseInt(form.grade), subject: form.subject,
          class_name: form.class_name || null, observation_date: form.observation_date,
        }
        const url = editing?.id ? `/api/supervisions/${editing.id}` : "/api/supervisions"
        const method = editing?.id ? "PUT" : "POST"
        const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        if (r.ok) { toast.success(editing?.id ? "Updated!" : "Created!"); setCreateOpen(false); fetchItems() }
        else toast.error("Failed")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervisions</h1>
          <p className="text-muted-foreground">{isPrincipal ? "Observe teachers using the SHB rubric (85 criteria). Default score: 4 (Excellent)." : isTeacher ? "View your supervision results." : ""}</p>
        </div>
        {(isPrincipal || isSuperAdmin) && <Button onClick={openNewSupervision}><Plus className="mr-1 h-4 w-4" /> New Supervision</Button>}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No supervisions yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{s.teacher?.full_name}</p>
                      <Badge variant="outline" className="text-xs">G{s.grade} {s.subject}</Badge>
                      {s.class_name && <Badge variant="secondary" className="text-xs">{s.class_name}</Badge>}
                      {statusBadge(s.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(s.observation_date).toLocaleDateString()}</p>
                    {s.principal_signature && <p className="text-xs text-green-600 mt-1">✓ Principal signed</p>}
                    {s.teacher_signature && <p className="text-xs text-blue-600">✓ Teacher signed</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(isPrincipal || isSuperAdmin) && (
                      <Button variant="ghost" size="icon" onClick={() => openEditSup(s)} title="Edit"><FileText className="h-4 w-4" /></Button>
                    )}
                    {isTeacher && s.status === "published" && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => setViewing(s)}><CheckCircle className="mr-1 h-3 w-3" /> Sign</Button>
                    )}
                    {s.status === "draft" && (isPrincipal || isSuperAdmin) && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => handlePublish(s)}><Send className="mr-1 h-3 w-3" /> Publish</Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setViewing(s)} title="View"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog with Full Rubric */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Supervision — Full Rubric (85 criteria)</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1"><Label>Teacher *</Label>
                <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" disabled={!!editing}>
                  <option value="">Select...</option>{teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select></div>
              <div className="space-y-1"><Label>Grade</Label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {[7,8,9,10,11,12].map(g => <option key={g} value={g}>G{g}</option>)}</select></div>
              <div className="space-y-1"><Label>Subject</Label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}</select></div>
              <div className="space-y-1"><Label>Class</Label>
                <input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder="A" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" /></div>
            </div>
            <div className="space-y-1"><Label>Observation Date</Label>
              <input type="date" value={form.observation_date} onChange={e => setForm(p => ({ ...p, observation_date: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" /></div>

            <Separator />

            <p className="text-xs text-muted-foreground">Rate each criterion: <strong>4</strong> (A - All of the time) to <strong>0</strong> (N - Never). Default is 4. Use sliders or click.</p>

            {TPA_CATEGORIES.map(cat => {
              const catScores = scores[cat.key] || {}
              const raw = cat.items.reduce((sum, item) => sum + (catScores[item.id] ?? 4), 0)
              const max = cat.items.length * 4
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{cat.label} ({cat.weight}%)</h3>
                    <span className="text-xs text-muted-foreground">{raw}/{max} · {max > 0 ? Math.round((raw / max) * 100) : 0}%</span>
                  </div>
                  <div className="space-y-2.5">
                    {cat.items.map(item => (
                      <div key={item.id}>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="w-5 text-muted-foreground shrink-0 text-right">{item.id}.</span>
                          <span className="flex-1 text-muted-foreground leading-tight">{item.text}</span>
                          <span className={`w-8 text-center text-xs font-bold rounded ${catScores[item.id] >= 3 ? 'text-green-600' : catScores[item.id] >= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                            {catScores[item.id] ?? 4}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 ml-8">
                          <span className="text-[10px] text-red-400 w-4 text-center">0</span>
                          <input type="range" min={0} max={4} step={1} value={catScores[item.id] ?? 4}
                            onChange={e => setScore(cat.key, item.id, parseInt(e.target.value))}
                            className="flex-1 h-1.5 rounded-full appearance-none bg-muted accent-primary cursor-pointer" />
                          <span className="text-[10px] text-green-400 w-4 text-center">4</span>
                          <div className="flex gap-0.5">
                            {[0,1,2,3,4].map(v => (
                              <button key={v} type="button" onClick={() => setScore(cat.key, item.id, v)}
                                className={`w-5 h-5 rounded text-[9px] font-medium transition-all ${(catScores[item.id] ?? 4) === v ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>{v}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            <Separator />
            {computedTotals && (
              <div className="rounded-lg border bg-card p-4">
                <h3 className="font-semibold text-sm mb-3">📊 Auto-Calculated Results</h3>
                <div className="space-y-2">
                  {computedTotals.details.map(d => (
                    <div key={d.key} className="flex items-center gap-2 text-xs">
                      <span className="w-36 shrink-0 text-muted-foreground">{d.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${d.max > 0 ? (d.raw / d.max) * 100 : 0}%` }} />
                      </div>
                      <span className="w-16 text-right font-medium">{d.max > 0 ? ((d.raw / d.max) * d.weight).toFixed(1) : "0"}%</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-bold text-sm">TOTAL SCORE</span>
                    <span className={`text-lg font-bold ${computedTotals.total >= 60 ? "text-green-600" : "text-red-600"}`}>{computedTotals.total.toFixed(1)}%</span>
                  </div>
                  <div className="text-center mt-1">
                    <Badge className={computedTotals.total >= 90 ? "bg-green-100 text-green-700" : computedTotals.total >= 80 ? "bg-blue-100 text-blue-700" : computedTotals.total >= 70 ? "bg-amber-100 text-amber-700" : computedTotals.total >= 60 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}>
                      {getGradeLabel(computedTotals.total)}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>Save Draft</Button>
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <Send className="mr-1 h-4 w-4" /> Submit & Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Supervision Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <p><strong>Teacher:</strong> {viewing.teacher?.full_name}</p>
              <p><strong>Grade/Subject:</strong> G{viewing.grade} {viewing.subject} {viewing.class_name}</p>
              <p><strong>Date:</strong> {new Date(viewing.observation_date).toLocaleDateString()}</p>
              <Separator />
              {viewing.principal_signature && <p className="text-green-600">✓ Principal: {viewing.principal_signature}</p>}
              {viewing.teacher_signature && <p className="text-blue-600">✓ Teacher: {viewing.teacher_signature}</p>}
              {isTeacher && viewing.status === "published" && (
                <Button className="w-full" onClick={handleSign}><CheckCircle className="mr-1 h-4 w-4" /> Sign & Acknowledge</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
