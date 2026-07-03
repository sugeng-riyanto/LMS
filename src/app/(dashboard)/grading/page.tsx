"use client"

import { useState, useEffect, useMemo } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckSquare, Square, Sparkles, Save, BookOpen, Palette, Search, ChevronDown, ChevronUp, Filter, Send, RotateCcw } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

const CATEGORIES = [
  { value: "classwork", label: "Classwork", weight: "40%" },
  { value: "unit_test", label: "Unit Test", weight: "20%" },
  { value: "project", label: "Project", weight: "10%" },
  { value: "homework", label: "Homework", weight: "10%" },
  { value: "mid_semester", label: "Mid Semester", weight: "10%" },
  { value: "final_semester", label: "Final Semester", weight: "10%" },
]

type ViewMode = "by_student" | "by_question"

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const { profile } = useAuth()
  const canView = isSuperAdmin || isTeacher

  const [assignedGrades, setAssignedGrades] = useState<number[]>([...GRADES])
  const [grade, setGrade] = useState(10)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>("by_student")
  const [publishing, setPublishing] = useState(false)
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)

  useEffect(() => {
    if (!canView || !profile?.id) return
    fetch(`/api/teacher/grading/assignments?teacher_id=${profile.id}`)
      .then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data) && data.length) {
          const grades = [...new Set(data.map((a: any) => a.grade))].sort()
          setAssignedGrades(grades)
          if (!grades.includes(grade)) setGrade(grades[0] || 10)
        }
      }).catch(() => {})
  }, [canView, profile])

  useEffect(() => { if (canView) fetchData() }, [grade, canView])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/grading?grade=${grade}&status=all`)
      const data = res.ok ? await res.json() : []
      setSubmissions(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  const questions = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const s of submissions) {
      const key = s.question_id || s.question_text || "unknown"
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [submissions])

  const grouped = useMemo(() => {
    return submissions.reduce<Record<string, any[]>>((acc, s) => {
      const sid = s.student_id
      if (!acc[sid]) acc[sid] = []
      acc[sid].push(s)
      return acc
    }, {})
  }, [submissions])

  const studentIds = useMemo(() => {
    return Object.keys(grouped).filter((sid) => {
      const student = grouped[sid][0]?.student
      return student?.full_name?.toLowerCase().includes(search.toLowerCase())
    })
  }, [grouped, search])

  const totalSubs = submissions.length
  const gradedCount = submissions.filter((w: any) => w.status === "graded").length
  const returnedCount = submissions.filter((w: any) => w.status === "returned").length
  const ungradedCount = submissions.filter((w: any) => w.status === "submitted").length

  function updateField(workId: string, field: string, val: any) {
    setSubmissions((prev: any[]) => prev.map((w: any) =>
      w.id === workId ? { ...w, [field]: val } : w
    ))
  }

  async function handleGrade(workId: string) {
    const w = submissions.find((x: any) => x.id === workId)
    if (!w) return
    setSaving(workId)
    try {
      const score = w._score !== undefined ? parseFloat(w._score) : w.score
      const feedback = w._feedback !== undefined ? w._feedback : w.feedback
      const cat = w._score_category ?? w.score_category
      const body: Record<string, unknown> = { score, feedback }
      if (cat) body.score_category = cat
      const res = await fetch(`/api/teacher/grading/${workId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) { toast.success("Saved!"); setSelected(new Set()); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setSaving(null) }
  }

  async function handleAutoGrade(workId: string) {
    setSaving(workId)
    try {
      const w = submissions.find((x: any) => x.id === workId)
      const cat = w?._score_category ?? w?.score_category
      const body: Record<string, unknown> = {}
      if (cat) body.score_category = cat
      const res = await fetch(`/api/teacher/grading/${workId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) { toast.success("Auto-graded!"); setSelected(new Set()); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setSaving(null) }
  }

  async function handlePublish(workId: string, action: "publish" | "unpublish") {
    setPublishing(true)
    try {
      const res = await fetch("/api/teacher/grading/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_ids: [workId], action }),
      })
      if (res.ok) { toast.success(action === "publish" ? "Published!" : "Unpublished!"); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setPublishing(false) }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(ids: string[]) {
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      }
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }

  async function handleBulkPublish(action: "publish" | "unpublish") {
    const ids = Array.from(selected)
    if (ids.length === 0) { toast.error("Select submissions first"); return }
    setPublishing(true)
    try {
      const res = await fetch("/api/teacher/grading/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_ids: ids, action }),
      })
      if (res.ok) {
        toast.success(action === "publish" ? "Published!" : "Unpublished!")
        setSelected(new Set())
        fetchData()
      } else {
        const e = await res.json().catch(() => ({ error: "Error" }))
        toast.error(e.error)
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setPublishing(false) }
  }

  async function handleBulkGrade() {
    const ids = Array.from(selected).filter((id) => {
      const w = submissions.find((x) => x.id === id)
      return w && w.status !== "graded" && w.status !== "returned"
    })
    if (ids.length === 0) { toast.error("No ungraded submissions selected"); return }
    setPublishing(true)
    let count = 0
    for (const id of ids) {
      const w = submissions.find((x) => x.id === id)
      if (!w) continue
      try {
        const score = w._score !== undefined ? parseFloat(w._score) : w.score
        const feedback = w._feedback !== undefined ? w._feedback : w.feedback
        if (score === undefined || score === null || isNaN(score)) continue
        const cat = w._score_category ?? w.score_category
        const body: Record<string, unknown> = { score, feedback }
        if (cat) body.score_category = cat
        const res = await fetch(`/api/teacher/grading/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) count++
      } catch {}
    }
    toast.success(`Graded ${count} submissions`)
    setSelected(new Set())
    setPublishing(false)
    fetchData()
  }

  async function handleBulkAutoGrade() {
    const ids = Array.from(selected).filter((id) => {
      const w = submissions.find((x) => x.id === id)
      return w && w.status !== "graded" && w.status !== "returned"
    })
    if (ids.length === 0) { toast.error("No ungraded submissions selected"); return }
    setPublishing(true)
    let count = 0
    for (const id of ids) {
      try {
        const res = await fetch(`/api/teacher/grading/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        if (res.ok) count++
      } catch {}
    }
    toast.success(`Auto-graded ${count} submissions`)
    setSelected(new Set())
    setPublishing(false)
    fetchData()
  }

  function renderWorkRow(work: any, showSelect = true) {
    const scoreVal = work._score !== undefined ? work._score : (work.score ?? "")
    const fbVal = work._feedback !== undefined ? work._feedback : (work.feedback ?? "")
    const catVal = work._score_category ?? work.score_category ?? ""
    const isGradedOrReturned = work.status === "graded" || work.status === "returned"

    return (
      <div key={work.id} className={`rounded-lg border p-3 space-y-3 ${work.status === "returned" ? "border-green-300 bg-green-50/30 dark:bg-green-950/10" : ""}`}>
        <div className="flex items-start gap-2 flex-wrap">
          {showSelect && (
            <button onClick={() => toggleSelect(work.id)} className="mt-0.5 shrink-0">
              {selected.has(work.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{work.question_type === "canvas" ? <><Palette className="mr-1 h-3 w-3" />Drawing</> : <><BookOpen className="mr-1 h-3 w-3" />Text</>}</Badge>
              <Badge variant={work.status === "returned" ? "default" : work.status === "graded" ? "secondary" : "outline"} className="text-[10px]">{work.status}</Badge>
              {work.score_category && <Badge variant="outline" className="text-[10px]">{work.score_category}</Badge>}
              {work.published_at && <Badge variant="outline" className="text-[10px] text-green-600">Published {new Date(work.published_at).toLocaleDateString()}</Badge>}
            </div>
            <p className="text-xs font-medium mt-1">{work.question_text || work.question_id}</p>
          </div>
        </div>

        <div className="rounded bg-muted/50 p-2 max-h-24 overflow-y-auto text-xs">
          {work.question_type === "canvas" && work.canvas_data
            ? <img src={work.canvas_data as string} alt="Drawing" className="max-h-16 rounded" />
            : <pre className="whitespace-pre-wrap">{work.answer_text || "(blank)"}</pre>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Score /{work.max_score ?? 10}</Label>
            <Input type="number" min={0} max={work.max_score ?? 10} step={0.5} value={scoreVal}
              onChange={(e) => updateField(work.id, "_score", e.target.value)}
              className="h-8 text-xs" />
          </div>
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-[10px]">Feedback</Label>
            <Textarea value={fbVal} onChange={(e) => updateField(work.id, "_feedback", e.target.value)}
              rows={1} className="h-8 text-xs resize-none" placeholder="Quick feedback..." />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Category *</Label>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button key={cat.value}
                  onClick={() => updateField(work.id, "_score_category", catVal === cat.value ? "" : cat.value)}
                  className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium transition-colors ${
                    catVal === cat.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent"
                  }`}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          <Button size="sm" className="h-7 text-xs" onClick={() => handleGrade(work.id)} disabled={saving === work.id}>
            <Save className="mr-1 h-3 w-3" />{saving === work.id ? "..." : "Grade"}
          </Button>
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleAutoGrade(work.id)} disabled={saving === work.id}>
            <Sparkles className="mr-1 h-3 w-3" />Auto
          </Button>
          <div className="flex-1" />
          {isGradedOrReturned && (
            work.status === "returned" ? (
              <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600" onClick={() => handlePublish(work.id, "unpublish")} disabled={publishing}>
                <RotateCcw className="mr-1 h-3 w-3" />Cancel Publish
              </Button>
            ) : (
              <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => handlePublish(work.id, "publish")} disabled={publishing || !work.score_category}>
                <Send className="mr-1 h-3 w-3" />Publish
              </Button>
            )
          )}
        </div>
      </div>
    )
  }

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  const selectedGraded = Array.from(selected).filter((id) => {
    const w = submissions.find((x) => x.id === id)
    return w && w.status === "graded"
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading</h1>
          <p className="text-sm text-muted-foreground">Review and score student work</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium">
              {assignedGrades.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Badge variant="outline" className="text-xs px-3 py-1">{totalSubs} total</Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1">{gradedCount} graded</Badge>
        <Badge variant="default" className="text-xs px-3 py-1">{returnedCount} returned</Badge>
        {ungradedCount > 0 && <Badge variant="outline" className="text-xs px-3 py-1 text-amber-600">{ungradedCount} ungraded</Badge>}
      </div>

      {/* View Toggle + Permanent Publish Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setViewMode("by_student")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "by_student" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
          By Student
        </button>
        <button onClick={() => setViewMode("by_question")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "by_question" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
          By Question
        </button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleBulkPublish("publish")} disabled={publishing || selectedGraded.length === 0}>
          <Send className="mr-1 h-3 w-3" />Publish Graded ({selectedGraded.length})
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleBulkPublish("unpublish")} disabled={publishing || selected.size === 0}>
          <RotateCcw className="mr-1 h-3 w-3" />Unpublish
        </Button>
        <div className="flex-1" />
        {selected.size > 0 && (
          <>
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleBulkGrade()} disabled={publishing}>
              <Save className="mr-1 h-3 w-3" />Grade
            </Button>
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleBulkAutoGrade()} disabled={publishing}>
              <Sparkles className="mr-1 h-3 w-3" />Auto
            </Button>
          </>
        )}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={viewMode === "by_student" ? "Search student..." : "Search question..."}
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />))}</div>
      ) : submissions.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No submissions for Grade {grade}.</CardContent></Card>
      ) : viewMode === "by_student" ? (
        <div className="space-y-4">
          {studentIds.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No students match.</CardContent></Card>
          ) : studentIds.map((sid) => {
            const works = grouped[sid]
            const student = works[0]?.student
            const isExpanded = expanded[sid] ?? true
            const g = works.filter((w: any) => w.status === "graded" || w.status === "returned")
            const r = works.filter((w: any) => w.status === "returned")
            const totalScore = works.reduce((s: number, w: any) => s + (w.score ?? 0), 0)
            const totalMax = works.reduce((s: number, w: any) => s + (w.max_score ?? 10), 0)

            return (
              <Card key={sid} className="overflow-hidden">
                <button onClick={() => setExpanded((p) => ({ ...p, [sid]: !p[sid] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {student?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{student?.full_name ?? "Unknown"}</p>
                        {r.length > 0 && <Badge variant="default" className="text-[10px] h-5">{r.length} returned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {works.length} questions · {g.length} graded · Score {totalScore.toFixed(1)}/{totalMax.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelectAll(works.map((w: any) => w.id)) }} className="text-xs text-muted-foreground hover:text-foreground" title="Select all">
                      <Square className="h-4 w-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {works.map((work: any) => renderWorkRow(work, true))}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No questions found.</CardContent></Card>
          ) : questions.map(([qid, qWorks]) => {
            const isExpanded = expanded[qid] ?? (activeQuestion === qid)
            return (
              <Card key={qid} className="overflow-hidden">
                <button onClick={() => { setExpanded((p) => ({ ...p, [qid]: !p[qid] })); setActiveQuestion(qid) }}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">Q</div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{qid.length > 60 ? qid.slice(0, 60) + "..." : qid}</p>
                      <p className="text-xs text-muted-foreground">{qWorks.length} submissions · {qWorks.filter((w: any) => w.status === "returned").length} returned</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelectAll(qWorks.map((w: any) => w.id)) }} className="text-xs text-muted-foreground hover:text-foreground" title="Select all">
                      <Square className="h-4 w-4" />
                    </button>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {qWorks.map((work: any) => (
                        <div key={work.id} className="flex items-start gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold shrink-0 mt-1">
                            {work.student?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium mb-1">{work.student?.full_name ?? "Unknown"}</p>
                            {renderWorkRow(work, true)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
