"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Send, Sparkles, Save, Eye, EyeOff, GraduationCap, BookOpen, Palette, Search, ChevronDown, ChevronUp } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

const CATEGORIES = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"] as const
const CAT_LABELS: Record<string, string> = {
  classwork: "Classwork", unit_test: "Unit Test", project: "Project",
  homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester",
}
const CAT_WEIGHTS: Record<string, number> = {
  classwork: 0.4, unit_test: 0.2, project: 0.1,
  homework: 0.1, mid_semester: 0.1, final_semester: 0.1,
}

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canView = isSuperAdmin || isTeacher

  const [grade, setGrade] = useState(10)
  const [students, setStudents] = useState<any[]>([])
  const [works, setWorks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { if (canView) { fetchData() } }, [grade, canView])

  async function fetchData() {
    setLoading(true)
    try {
      const [subRes, profRes] = await Promise.all([
        fetch(`/api/teacher/grading?grade=${grade}&status=all`),
        fetch("/api/profiles"),
      ])
      const submissions = subRes.ok ? await subRes.json() : (console.error("Grading API:", subRes.status, await subRes.text().catch(() => "")), [])
      const profiles = profRes.ok ? await profRes.json() : (console.error("Profiles API:", profRes.status), [])
      setWorks(submissions)
      // Extract unique students from submission data first
      const seen = new Set<string>()
      const fromSubs = (Array.isArray(submissions) ? submissions : [])
        .filter((w: any) => { if (!w.student) return false; if (seen.has(w.student_id)) return false; seen.add(w.student_id); return true })
        .map((w: any) => w.student)
      // Fallback: get students from profiles if no submissions yet
      const fromProfiles = (Array.isArray(profiles) ? profiles : [])
        .filter((p: any) => p.role === "student" && p.grade_assigned === grade && !seen.has(p.id))
      setStudents([...fromSubs, ...fromProfiles])
    } catch (e) { console.error("Grading fetch error:", e) } finally { setLoading(false) }
  }

  function getStudentWork(studentId: string) {
    return works.filter((w: any) => w.student_id === studentId)
  }

  function updateScore(workId: string, score: string) {
    setWorks((prev: any[]) => prev.map((w: any) => w.id === workId ? { ...w, _score: score } : w))
  }

  function updateFeedback(workId: string, feedback: string) {
    setWorks((prev: any[]) => prev.map((w: any) => w.id === workId ? { ...w, _feedback: feedback } : w))
  }

  async function handleGrade(workId: string) {
    const w = works.find((x: any) => x.id === workId)
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
      if (res.ok) { toast.success("Saved!"); fetchData() }
      else { const err = await res.json().catch(() => ({ error: "Unknown" })); toast.error(err.error || "Failed") }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(null) }
  }

  async function handleAutoGrade(workId: string) {
    setSaving(workId)
    try {
      const res = await fetch(`/api/teacher/grading/${workId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      if (res.ok) { toast.success("Auto-graded!"); fetchData() }
      else { const err = await res.json().catch(() => ({ error: "Unknown" })); toast.error(err.error || "Failed") }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(null) }
  }

  const filtered = students.filter((s: any) =>
    s.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  function calcWeighted(studentWorks: any[]) {
    const byCat: Record<string, number[]> = {}
    CATEGORIES.forEach(c => byCat[c] = [])
    studentWorks.forEach((w: any) => {
      const cat = w.score_category || "classwork"
      if (w.score !== null && w.score !== undefined) byCat[cat]?.push(w.score)
    })
    let total = 0
    CATEGORIES.forEach(c => {
      if (byCat[c]?.length) total += (byCat[c].reduce((a: number, b: number) => a + b, 0) / byCat[c].length) * CAT_WEIGHTS[c]
    })
    return Math.round(total * 10) / 10
  }

  const totalSubmissions = works.length
  const totalGraded = works.filter((w: any) => w.status === "graded").length

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading</h1>
          <p className="text-sm text-muted-foreground">Review student work, assign scores, and give feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Grade</Label>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium">
              {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
            </select>
          </div>
          <Badge variant="outline" className="text-xs">{students.length} students</Badge>
          <Badge variant={totalGraded === totalSubmissions && totalSubmissions > 0 ? "default" : "secondary"} className="text-xs">
            {totalGraded}/{totalSubmissions} graded
          </Badge>
          <span className="text-xs text-muted-foreground">{works.length} submissions</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student..." 
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />))}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          {search ? "No students match your search." : `No submissions for Grade ${grade}. Students need to submit work first.`}
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((student: any) => {
            const studentWorks = getStudentWork(student.id)
            const weighted = studentWorks.length > 0 ? calcWeighted(studentWorks) : null
            const isExpanded = expanded[student.id] ?? false
            const graded = studentWorks.filter((w: any) => w.status === "graded").length

            return (
              <Card key={student.id} className="overflow-hidden">
                {/* Student Header */}
                <button onClick={() => setExpanded((p) => ({ ...p, [student.id]: !p[student.id] }))}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/50 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {student.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <p className="font-semibold">{student.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Grade {student.grade_assigned}</span>
                        <span>·</span>
                        <span>{graded}/{studentWorks.length} graded</span>
                        {weighted !== null && (
                          <>
                            <span>·</span>
                            <span className={weighted >= 60 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                              {weighted.toFixed(1)}% weighted
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    <Separator />
                    <div className="p-4 space-y-4">
                      {studentWorks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No submissions yet.</p>
                      ) : (
                        studentWorks.map((work: any) => {
                          const scoreVal = work._score !== undefined ? work._score : (work.score ?? "")
                          const fbVal = work._feedback !== undefined ? work._feedback : (work.feedback ?? "")
                          const catLabel = CAT_LABELS[work.score_category || "classwork"] || "General"

                          return (
                            <div key={work.id} className="rounded-lg border p-4 space-y-3">
                              {/* Question + Status */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-[10px]">{catLabel}</Badge>
                                    <Badge variant={work.question_type === "canvas" ? "secondary" : "outline"} className="text-[10px]">
                                      {work.question_type === "canvas" ? <Palette className="mr-1 h-3 w-3" /> : <BookOpen className="mr-1 h-3 w-3" />}
                                      {work.question_type}
                                    </Badge>
                                    <Badge variant={work.status === "graded" ? "default" : "secondary"} className="text-[10px]">
                                      {work.status}
                                    </Badge>
                                  </div>
                                  <p className="text-sm mt-1 font-medium">{work.question_text}</p>
                                </div>
                              </div>

                              {/* Student Answer */}
                              <div className="rounded-lg bg-muted/50 p-3 max-h-40 overflow-y-auto">
                                {work.question_type === "canvas" ? (
                                  work.canvas_data ? (
                                    <img src={work.canvas_data as string} alt="Student drawing" className="max-h-32 rounded border" />
                                  ) : <p className="text-xs text-muted-foreground italic">(blank canvas)</p>
                                ) : (
                                  <pre className="text-xs whitespace-pre-wrap">{work.answer_text || <span className="italic text-muted-foreground">(no answer)</span>}</pre>
                                )}
                              </div>

                              {/* Score + Feedback Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Score (max {work.max_score ?? 10})</Label>
                                  <Input type="number" min={0} max={work.max_score ?? 10} step={0.5}
                                    value={scoreVal}
                                    onChange={(e) => updateScore(work.id, e.target.value)}
                                    className="h-9 text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Feedback</Label>
                                  <Textarea value={fbVal}
                                    onChange={(e) => updateFeedback(work.id, e.target.value)}
                                    rows={2} className="text-sm resize-none" placeholder="Write feedback..." />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleGrade(work.id)} disabled={saving === work.id}>
                                  <Save className="mr-1 h-3 w-3" />{saving === work.id ? "Saving..." : "Grade"}
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleAutoGrade(work.id)} disabled={saving === work.id}>
                                  <Sparkles className="mr-1 h-3 w-3" />Auto-Grade
                                </Button>
                              </div>
                            </div>
                          )
                        })
                      )}

                      {/* Weighted Total */}
                      {studentWorks.length > 0 && weighted !== null && (
                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
                          <span className="text-sm font-medium">Overall Weighted Score</span>
                          <span className={`text-lg font-bold ${weighted >= 60 ? "text-green-600" : "text-red-600"}`}>
                            {weighted.toFixed(1)}%
                          </span>
                        </div>
                      )}
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
