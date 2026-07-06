"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Eye, Edit3, Send, CheckCircle, Trash2, FileText } from "lucide-react"
import toast from "react-hot-toast"

interface Supervision {
  id: string
  teacher_id: string
  grade: number
  subject: string
  class_name: string | null
  observation_date: string
  status: string
  teaching_quality_score: number | null
  classroom_management_score: number | null
  student_engagement_score: number | null
  notes: string | null
  strengths: string | null
  areas_for_improvement: string | null
  principal_signature: string | null
  teacher_signature: string | null
  principal_signed_at: string | null
  teacher_signed_at: string | null
  teacher: { id: string; full_name: string }
  created_at: string
}

export default function SupervisionsPage() {
  const { profile } = useAuth()
  const { isPrincipal, isTeacher, isSuperAdmin } = useRBAC()
  const [items, setItems] = useState<Supervision[]>([])
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supervision | null>(null)
  const [viewing, setViewing] = useState<Supervision | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    teacher_id: "", grade: "10", subject: "PHY", class_name: "",
    observation_date: new Date().toISOString().split("T")[0],
    teaching_quality_score: "", classroom_management_score: "", student_engagement_score: "",
    notes: "", strengths: "", areas_for_improvement: "",
  })

  useEffect(() => { if (isPrincipal || isSuperAdmin) fetchTeachers() }, [])
  useEffect(() => { fetchItems() }, [isPrincipal, isTeacher])

  async function fetchTeachers() {
    try {
      const res = await fetch("/api/profiles?role=teacher")
      if (res.ok) setTeachers(await res.json())
    } catch {}
  }

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch("/api/supervisions")
      if (res.ok) setItems(await res.json())
    } catch {}
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!form.teacher_id) { toast.error("Select a teacher"); return }
    setSaving(true)
    try {
      const body = {
        teacher_id: form.teacher_id, grade: parseInt(form.grade), subject: form.subject,
        class_name: form.class_name || null, observation_date: form.observation_date,
        teaching_quality_score: form.teaching_quality_score ? parseInt(form.teaching_quality_score) : null,
        classroom_management_score: form.classroom_management_score ? parseInt(form.classroom_management_score) : null,
        student_engagement_score: form.student_engagement_score ? parseInt(form.student_engagement_score) : null,
        notes: form.notes || null, strengths: form.strengths || null, areas_for_improvement: form.areas_for_improvement || null,
      }
      const url = editing ? `/api/supervisions/${editing.id}` : "/api/supervisions"
      const method = editing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) { toast.success(editing ? "Updated!" : "Created!"); setDialogOpen(false); resetForm(); fetchItems() }
      else { const e = await res.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
    finally { setSaving(false) }
  }

  async function handlePublish(s: Supervision) {
    try {
      const res = await fetch(`/api/supervisions/${s.id}/publish`, { method: "POST" })
      if (res.ok) { toast.success("Published to teacher!"); fetchItems() }
      else toast.error("Failed to publish")
    } catch { toast.error("Failed") }
  }

  async function handleSign() {
    if (!viewing || viewing.status !== "published") return
    try {
      const res = await fetch(`/api/supervisions/${viewing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_signature: `Signed by ${profile?.full_name}` }),
      })
      if (res.ok) { toast.success("Signed!"); setViewing(null); fetchItems() }
      else toast.error("Failed to sign")
    } catch { toast.error("Failed") }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this supervision?")) return
    try {
      const res = await fetch(`/api/supervisions/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted"); fetchItems() }
    } catch {}
  }

  function openEdit(s: Supervision) {
    setEditing(s)
    setForm({
      teacher_id: s.teacher_id, grade: String(s.grade), subject: s.subject, class_name: s.class_name || "",
      observation_date: s.observation_date?.split("T")[0] || "",
      teaching_quality_score: s.teaching_quality_score ? String(s.teaching_quality_score) : "",
      classroom_management_score: s.classroom_management_score ? String(s.classroom_management_score) : "",
      student_engagement_score: s.student_engagement_score ? String(s.student_engagement_score) : "",
      notes: s.notes || "", strengths: s.strengths || "", areas_for_improvement: s.areas_for_improvement || "",
    })
    setDialogOpen(true)
  }

  function resetForm() {
    setEditing(null)
    setForm({ teacher_id: "", grade: "10", subject: "PHY", class_name: "", observation_date: new Date().toISOString().split("T")[0], teaching_quality_score: "", classroom_management_score: "", student_engagement_score: "", notes: "", strengths: "", areas_for_improvement: "" })
  }

  const SUBJECTS = [
    { code: "PHY", name: "Physics" }, { code: "MAT", name: "Mathematics" },
    { code: "CHE", name: "Chemistry" }, { code: "BIO", name: "Biology" }, { code: "ECO", name: "Economics" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervisions</h1>
          <p className="text-muted-foreground">{isPrincipal ? "Observe teachers and publish feedback." : isTeacher ? "View your supervision results." : ""}</p>
        </div>
        {(isPrincipal || isSuperAdmin) && (
          <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
            <Plus className="mr-1 h-4 w-4" /> New Supervision
          </Button>
        )}
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
                      <p className="font-semibold">{s.teacher?.full_name || "Unknown Teacher"}</p>
                      <Badge variant="outline" className="text-xs">G{s.grade} {s.subject}</Badge>
                      {s.class_name && <Badge variant="secondary" className="text-xs">{s.class_name}</Badge>}
                      <Badge className={`text-xs ${s.status === 'published' ? 'bg-green-100 text-green-700' : s.status === 'acknowledged' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {s.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(s.observation_date).toLocaleDateString()}</p>
                    {s.teaching_quality_score && (
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>Teaching: {s.teaching_quality_score}/5</span>
                        <span>Management: {s.classroom_management_score}/5</span>
                        <span>Engagement: {s.student_engagement_score}/5</span>
                      </div>
                    )}
                    {s.principal_signature && <p className="text-xs text-green-600 mt-1">✓ Principal signed</p>}
                    {s.teacher_signature && <p className="text-xs text-blue-600 mt-1">✓ Teacher signed</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {(isPrincipal || isSuperAdmin) && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} title="Edit"><Edit3 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} title="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Supervision</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Teacher *</Label>
              <select value={form.teacher_id} onChange={e => setForm(p => ({ ...p, teacher_id: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" disabled={!!editing}>
                <option value="">Select teacher...</option>
                {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Grade</Label>
                <select value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {[7,8,9,10,11,12].map(g => <option key={g} value={g}>G{g}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {SUBJECTS.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Class</Label>
                <Input value={form.class_name} onChange={e => setForm(p => ({ ...p, class_name: e.target.value }))} placeholder="A" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observation Date</Label>
              <Input type="date" value={form.observation_date} onChange={e => setForm(p => ({ ...p, observation_date: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Teaching (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.teaching_quality_score} onChange={e => setForm(p => ({ ...p, teaching_quality_score: e.target.value }))} />
              </div>
              <div className="space-y-1"><Label>Management (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.classroom_management_score} onChange={e => setForm(p => ({ ...p, classroom_management_score: e.target.value }))} />
              </div>
              <div className="space-y-1"><Label>Engagement (1-5)</Label>
                <Input type="number" min={1} max={5} value={form.student_engagement_score} onChange={e => setForm(p => ({ ...p, student_engagement_score: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1"><Label>Strengths</Label>
              <Textarea value={form.strengths} onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))} rows={2} /></div>
            <div className="space-y-1"><Label>Areas for Improvement</Label>
              <Textarea value={form.areas_for_improvement} onChange={e => setForm(p => ({ ...p, areas_for_improvement: e.target.value }))} rows={2} /></div>
            <div className="space-y-1"><Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => { if (!o) setViewing(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Supervision Details</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Badge variant="outline">G{viewing.grade} {viewing.subject}</Badge>{viewing.class_name && <Badge variant="secondary">{viewing.class_name}</Badge>}<Badge>{viewing.status}</Badge></div>
              <p><strong>Teacher:</strong> {viewing.teacher?.full_name}</p>
              <p><strong>Date:</strong> {new Date(viewing.observation_date).toLocaleDateString()}</p>
              {viewing.teaching_quality_score && <p><strong>Scores:</strong> Teaching {viewing.teaching_quality_score}/5 · Management {viewing.classroom_management_score}/5 · Engagement {viewing.student_engagement_score}/5</p>}
              {viewing.strengths && <p><strong>Strengths:</strong> {viewing.strengths}</p>}
              {viewing.areas_for_improvement && <p><strong>Improvement:</strong> {viewing.areas_for_improvement}</p>}
              {viewing.notes && <p><strong>Notes:</strong> {viewing.notes}</p>}
              <div className="border-t pt-2 mt-2 space-y-1">
                {viewing.principal_signature ? <p className="text-green-600">✓ Principal: {viewing.principal_signature}</p> : <p className="text-muted-foreground">✗ Principal not signed</p>}
                {viewing.teacher_signature ? <p className="text-blue-600">✓ Teacher: {viewing.teacher_signature}</p> : <p className="text-muted-foreground">✗ Teacher not signed</p>}
              </div>
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
