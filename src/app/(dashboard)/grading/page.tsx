"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Sparkles, Save, Eye, EyeOff, BookOpen, Palette, Search, ChevronDown, ChevronUp, GraduationCap, Filter } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

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

  // Fetch teacher's assigned grades
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

  // Group submissions by student
  const grouped = submissions.reduce<Record<string, any[]>>((acc, s) => {
    const sid = s.student_id
    if (!acc[sid]) acc[sid] = []
    acc[sid].push(s)
    return acc
  }, {})

  const studentIds = Object.keys(grouped).filter((sid) => {
    const student = grouped[sid][0]?.student
    return student?.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  function updateScore(workId: string, val: string) {
    setSubmissions((prev: any[]) => prev.map((w: any) => w.id === workId ? { ...w, _score: val } : w))
  }

  function updateFeedback(workId: string, val: string) {
    setSubmissions((prev: any[]) => prev.map((w: any) => w.id === workId ? { ...w, _feedback: val } : w))
  }

  async function handleGrade(workId: string) {
    const w = submissions.find((x: any) => x.id === workId)
    if (!w) return
    setSaving(workId)
    try {
      const res = await fetch(`/api/teacher/grading/${workId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: w._score !== undefined ? parseFloat(w._score) : w.score,
          feedback: w._feedback !== undefined ? w._feedback : w.feedback,
        }),
      })
      if (res.ok) { toast.success("Graded!"); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setSaving(null) }
  }

  async function handleAutoGrade(workId: string) {
    setSaving(workId)
    try {
      const res = await fetch(`/api/teacher/grading/${workId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      if (res.ok) { toast.success("Auto-graded!"); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error") }
    finally { setSaving(null) }
  }

  const totalSubs = submissions.length
  const totalGraded = submissions.filter((w: any) => w.status === "graded").length

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Badge variant="outline" className="text-xs">{studentIds.length} students</Badge>
          <Badge variant={totalGraded === totalSubs && totalSubs > 0 ? "default" : "secondary"} className="text-xs">
            {totalGraded}/{totalSubs} graded
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />))}</div>
      ) : studentIds.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          {search ? "No students match." : `No submissions for Grade ${grade}.`}
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {studentIds.map((sid) => {
            const works = grouped[sid]
            const student = works[0]?.student
            const isExpanded = expanded[sid] ?? true
            const graded = works.filter((w: any) => w.status === "graded").length

            return (
              <Card key={sid} className="overflow-hidden">
                <button onClick={() => setExpanded((p) => ({ ...p, [sid]: !p[sid] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {student?.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold">{student?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {works.length} question{works.length > 1 ? "s" : ""} · {graded} graded
                      </p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <>
                    <Separator />
                    <div className="p-4 space-y-3">
                      {works.map((work: any) => {
                        const scoreVal = work._score !== undefined ? work._score : (work.score ?? "")
                        const fbVal = work._feedback !== undefined ? work._feedback : (work.feedback ?? "")

                        return (
                          <div key={work.id} className="rounded-lg border p-3 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px]">{work.question_type === "canvas" ? <><Palette className="mr-1 h-3 w-3" />Drawing</> : <><BookOpen className="mr-1 h-3 w-3" />Text</>}</Badge>
                              <Badge variant={work.status === "graded" ? "default" : "secondary"} className="text-[10px]">{work.status}</Badge>
                              {work.score_category && <Badge variant="outline" className="text-[10px]">{work.score_category}</Badge>}
                            </div>
                            <p className="text-xs font-medium">{work.question_text || work.question_id}</p>

                            {/* Student Answer */}
                            <div className="rounded bg-muted/50 p-2 max-h-24 overflow-y-auto text-xs">
                              {work.question_type === "canvas" && work.canvas_data
                                ? <img src={work.canvas_data as string} alt="Drawing" className="max-h-16 rounded" />
                                : <pre className="whitespace-pre-wrap">{work.answer_text || "(blank)"}</pre>}
                            </div>

                            {/* Score + Feedback */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <Label className="text-[10px]">Score</Label>
                                <Input type="number" min={0} max={10} step={0.5} value={scoreVal}
                                  onChange={(e) => updateScore(work.id, e.target.value)}
                                  className="h-8 text-xs" />
                              </div>
                              <div className="col-span-2 space-y-1">
                                <Label className="text-[10px]">Feedback</Label>
                                <Textarea value={fbVal} onChange={(e) => updateFeedback(work.id, e.target.value)}
                                  rows={1} className="h-8 text-xs resize-none" placeholder="Quick feedback..." />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs" onClick={() => handleGrade(work.id)} disabled={saving === work.id}>
                                <Save className="mr-1 h-3 w-3" />{saving === work.id ? "..." : "Grade"}
                              </Button>
                              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleAutoGrade(work.id)} disabled={saving === work.id}>
                                <Sparkles className="mr-1 h-3 w-3" />Auto
                              </Button>
                            </div>
                          </div>
                        )
                      })}
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
