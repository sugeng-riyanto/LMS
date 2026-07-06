"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Plus, Eye, Send, CheckCircle, Trash2, FileSpreadsheet } from "lucide-react"
import { TPA_CATEGORIES, SCORE_LABELS, SCORE_COLORS, calculateTotal, getGradeLabel, GRADE_INTERPRETATION } from "@/tpa/rubric"
import toast from "react-hot-toast"

type TPAStatus = "draft" | "principal_submitted" | "teacher_submitted" | "completed"

interface TPARecord {
  id: string
  teacher_id: string
  principal_id: string
  academic_year: string
  semester: number
  subject: string | null
  grade: number | null
  principal_scores: any
  principal_total: number | null
  principal_submitted_at: string | null
  teacher_scores: any
  teacher_total: number | null
  teacher_submitted_at: string | null
  combined_total: number | null
  combined_grade: string | null
  status: TPAStatus
  principal_signature: string | null
  teacher_signature: string | null
  pre_appraisal_held: boolean
  post_conference_held: boolean
  visit_count: number
  teacher: { id: string; full_name: string }
  created_at: string
}

export default function TPAPage() {
  const { profile } = useAuth()
  const { isPrincipal, isTeacher, isSuperAdmin } = useRBAC()
  const [items, setItems] = useState<TPARecord[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<TPARecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ teacher_id: "", semester: "1", subject: "PHY", grade: "10" })
  const [saving, setSaving] = useState(false)
  const [editingScores, setEditingScores] = useState<TPARecord | null>(null)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => { if (isPrincipal || isSuperAdmin) fetchTeachers() }, [])
  useEffect(() => { fetchItems() }, [])

  async function fetchTeachers() {
    try { const r = await fetch("/api/profiles?role=teacher"); if (r.ok) setTeachers(await r.json()) } catch {}
  }

  async function fetchItems() {
    setLoading(true)
    try { const r = await fetch("/api/tpa"); if (r.ok) setItems(await r.json()) } catch {}
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!form.teacher_id) { toast.error("Select a teacher"); return }
    setSaving(true)
    try {
      const r = await fetch("/api/tpa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teacher_id: form.teacher_id, semester: parseInt(form.semester), subject: form.subject, grade: parseInt(form.grade) }) })
      if (r.ok) { toast.success("Created!"); setCreateOpen(false); fetchItems() }
      else { const e = await r.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  function openScores(tpa: TPARecord) {
    const isPrincipalView = isPrincipal || isSuperAdmin
    const existingScores = isPrincipalView ? tpa.principal_scores : tpa.teacher_scores
    const s: Record<string, Record<string, number>> = {}
    if (existingScores) {
      for (const cat of TPA_CATEGORIES) s[cat.key] = existingScores[cat.key] || {}
    } else {
      for (const cat of TPA_CATEGORIES) {
        s[cat.key] = {}
        cat.items.forEach(item => { s[cat.key][item.id] = 0 })
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
      const raw = cat.items.reduce((sum, item) => sum + (s[item.id] ?? 0), 0)
      catScores[cat.key] = { raw, max: cat.items.length * 4 }
    }
    const total = calculateTotal(catScores)
    return { catScores, total }
  }, [scores, editingScores])

  async function handleSaveScores(submit: boolean) {
    if (!editingScores) return
    setSaving(true)
    try {
      const isPrincipalView = isPrincipal || isSuperAdmin
      const body: any = {}
      if (isPrincipalView) {
        body.principal_scores = scores
        body.grade = editingScores.grade
        body.subject = editingScores.subject
        if (submit) body.submit = true
      } else {
        body.teacher_scores = scores
      }
      const r = await fetch(`/api/tpa/${editingScores.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (r.ok) { toast.success(submit ? "Submitted!" : "Saved!"); setEditingScores(null); fetchItems() }
      else { const e = await r.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { draft: "bg-amber-100 text-amber-700", principal_submitted: "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700" }
    return <Badge className={map[s] || ""}>{s.replace(/_/g, " ")}</Badge>
  }

  const SUBJECTS = [{ code: "PHY", name: "Physics" }, { code: "MAT", name: "Mathematics" }, { code: "CHE", name: "Chemistry" }, { code: "BIO", name: "Biology" }, { code: "ECO", name: "Economics" }]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teacher Performance Assessment</h1>
          <p className="text-muted-foreground">{isPrincipal ? "Evaluate teachers using the SHB rubric (6 categories, 100% total)." : isTeacher ? "View and complete your self-assessment." : ""}</p>
        </div>
        {(isPrincipal || isSuperAdmin) && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-4 w-4" /> New Assessment</Button>}
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No assessments yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((tpa) => (
            <Card key={tpa.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{tpa.teacher?.full_name}</p>
                      {tpa.grade && <Badge variant="outline" className="text-xs">G{tpa.grade}</Badge>}
                      {tpa.subject && <Badge variant="secondary" className="text-xs">{tpa.subject}</Badge>}
                      {statusBadge(tpa.status)}
                      <Badge variant="outline" className="text-xs">S{tpa.semester} {tpa.academic_year}</Badge>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {tpa.principal_total != null && <span>Principal: <strong>{tpa.principal_total.toFixed(1)}%</strong></span>}
                      {tpa.teacher_total != null && <span>Teacher: <strong>{tpa.teacher_total.toFixed(1)}%</strong></span>}
                      {tpa.combined_total != null && <span>Combined: <strong className="text-primary">{tpa.combined_total.toFixed(1)}%</strong> <Badge variant="outline" className="text-[10px]">{tpa.combined_grade}</Badge></span>}
                      {tpa.principal_signature && <span className="text-green-600">✓ Principal signed</span>}
                      {tpa.teacher_signature && <span className="text-blue-600">✓ Teacher signed</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {/* Principal: fill scores or view */}
                    {(isPrincipal || isSuperAdmin) && (
                      tpa.status === "draft" ? (
                        <Button size="sm" className="h-8 text-xs" onClick={() => openScores(tpa)}><FileSpreadsheet className="mr-1 h-3 w-3" /> Fill Scores</Button>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setViewing(tpa)} title="View"><Eye className="h-4 w-4" /></Button>
                      )
                    )}
                    {/* Teacher: fill self-assessment when requested */}
                    {isTeacher && tpa.status === "principal_submitted" && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => openScores(tpa)}><FileSpreadsheet className="mr-1 h-3 w-3" /> Self-Assessment</Button>
                    )}
                    {isTeacher && tpa.status !== "principal_submitted" && (
                      <Button variant="ghost" size="icon" onClick={() => setViewing(tpa)} title="View"><Eye className="h-4 w-4" /></Button>
                    )}
                    {(isPrincipal || isSuperAdmin) && tpa.status === "draft" && (
                      <Button variant="ghost" size="icon" onClick={async () => { if (!confirm("Delete?")) return; await fetch(`/api/tpa/${tpa.id}`, { method: "DELETE" }); fetchItems() }} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <div className="space-y-1"><Label>Semester</Label>
                <select value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="1">Semester 1</option><option value="2">Semester 2</option></select></div>
              <div className="space-y-1"><Label>Grade</Label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">{Array.from({ length: 6 }, (_, i) => i + 7).map(g => <option key={g} value={g}>G{g}</option>)}</select></div>
              <div className="space-y-1"><Label>Subject</Label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">{SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}</select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={saving}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scores Editing Dialog */}
      <Dialog open={!!editingScores} onOpenChange={(o) => { if (!o) setEditingScores(null) }} >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingScores?.teacher?.full_name} — {isPrincipal ? "Principal Assessment" : "Self-Assessment"}</DialogTitle>
          </DialogHeader>
          {editingScores && (
            <div className="space-y-6">
              {TPA_CATEGORIES.map(cat => {
                const catScores = scores[cat.key] || {}
                const raw = cat.items.reduce((sum, item) => sum + (catScores[item.id] ?? 0), 0)
                const max = cat.items.length * 4
                const pct = max > 0 ? Math.round((raw / max) * 100) : 0
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{cat.label} ({cat.weight}%)</h3>
                      <span className="text-xs text-muted-foreground">{raw}/{max} · {pct}%</span>
                    </div>
                    <div className="space-y-1.5">
                      {cat.items.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <span className="w-5 text-muted-foreground shrink-0 text-right">{item.id}.</span>
                          <span className="flex-1 text-muted-foreground">{item.text}</span>
                          <div className="flex gap-0.5 shrink-0">
                            {[0, 1, 2, 3, 4].map(v => (
                              <button key={v} type="button"
                                onClick={() => setScore(cat.key, item.id, v)}
                                className={`w-6 h-6 rounded text-[10px] font-medium transition-all ${(catScores[item.id] ?? 0) === v ? SCORE_COLORS[v] : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                              >{v}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  {computedTotals && (
                    <p className="text-lg font-bold">Total: {computedTotals.total.toFixed(1)}%</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingScores(null)}>Cancel</Button>
                  {(isPrincipal || isSuperAdmin) && editingScores.status === "draft" && (
                    <Button onClick={() => handleSaveScores(false)} disabled={saving}>Save Draft</Button>
                  )}
                  {isPrincipal && editingScores.status === "draft" && (
                    <Button onClick={() => handleSaveScores(true)} disabled={saving} className="bg-green-600 hover:bg-green-700">
                      <Send className="mr-1 h-4 w-4" /> Submit to Teacher
                    </Button>
                  )}
                  {isTeacher && editingScores.status === "principal_submitted" && (
                    <Button onClick={() => handleSaveScores(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="mr-1 h-4 w-4" /> Submit Self-Assessment
                    </Button>
                  )}
                  {(isPrincipal || isSuperAdmin) && editingScores.status !== "draft" && (
                    <Button variant="outline" onClick={() => setEditingScores(null)}>Close</Button>
                  )}
                </div>
              </div>

              {/* Grade Interpretation */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-semibold mb-1">Grade Interpretation</p>
                <div className="grid grid-cols-5 gap-1 text-[10px]">
                  {GRADE_INTERPRETATION.map(g => (
                    <div key={g.label} className={`text-center p-1 rounded ${computedTotals && computedTotals.total >= g.min && computedTotals.total <= g.max ? 'bg-primary/20 font-bold' : ''}`}>
                      <span>{g.min}-{g.max === 100 ? '100' : g.max}%</span>
                      <p>{g.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Assessment Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <p><strong>Teacher:</strong> {viewing.teacher?.full_name}</p>
              <p><strong>Semester:</strong> {viewing.semester} · {viewing.academic_year} · G{viewing.grade} {viewing.subject}</p>
              {viewing.principal_total != null && <p><strong>Principal Score:</strong> {viewing.principal_total.toFixed(1)}%</p>}
              {viewing.teacher_total != null && <p><strong>Teacher Score:</strong> {viewing.teacher_total.toFixed(1)}%</p>}
              {viewing.combined_total != null && <p><strong>Combined Total:</strong> {viewing.combined_total.toFixed(1)}% · <Badge>{viewing.combined_grade}</Badge></p>}
              <Separator />
              <p><strong>Pre-Appraisal Conference:</strong> {viewing.pre_appraisal_held ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Post Conference:</strong> {viewing.post_conference_held ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Number of Visits:</strong> {viewing.visit_count}</p>
              <Separator />
              {viewing.principal_signature && <p className="text-green-600">✓ Principal: {viewing.principal_signature}</p>}
              {viewing.teacher_signature && <p className="text-blue-600">✓ Teacher: {viewing.teacher_signature}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
