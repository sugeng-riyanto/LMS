"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Send, Sparkles, Save, Eye, EyeOff, GraduationCap, BookOpen, Palette } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

interface Student {
  id: string
  full_name: string
  email: string
  grade_assigned: number
}

interface WorkItem {
  id: string
  student_id: string
  question_id: string
  question_text: string
  question_type: string
  answer_text: string | null
  canvas_data: unknown
  score: number | null
  max_score: number
  feedback: string | null
  status: string
  submitted_at: string
  student: Student
}

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canView = isSuperAdmin || isTeacher

  const [filterGrade, setFilterGrade] = useState<number>(10)
  const [filterStatus, setFilterStatus] = useState("submitted")
  const [works, setWorks] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<Record<string, string>>({})
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({})
  const [autoGradeLoading, setAutoGradeLoading] = useState<string | null>(null)

  useEffect(() => {
    if (canView) fetchWorks()
  }, [filterGrade, filterStatus])

  async function fetchWorks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/grading?grade=${filterGrade}&status=${filterStatus}`)
      if (res.ok) {
        const data = await res.json()
        setWorks(data)
        const s: Record<string, string> = {}
        const f: Record<string, string> = {}
        data.forEach((w: WorkItem) => {
          s[w.id] = String(w.score ?? "")
          f[w.id] = w.feedback ?? ""
        })
        setScores(s)
        setFeedbacks(f)
      }
    } catch { toast.error("Failed to load.") }
    finally { setLoading(false) }
  }

  async function handleGrade(id: string, auto = false) {
    setSaving(id)
    try {
      const payload: Record<string, unknown> = {
        score: scores[id] ? parseFloat(scores[id]) : null,
        feedback: feedbacks[id] ?? "",
      }

      let res: Response
      if (auto) {
        setAutoGradeLoading(id)
        res = await fetch(`/api/teacher/grading/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        setAutoGradeLoading(null)
      } else {
        res = await fetch(`/api/teacher/grading/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const updated = await res.json()
        toast.success(auto ? "Auto-graded!" : "Saved!")
        setScores((prev) => ({ ...prev, [id]: String(updated.score ?? "") }))
        setFeedbacks((prev) => ({ ...prev, [id]: updated.feedback ?? "" }))
        fetchWorks()
      } else {
        toast.error("Failed to save.")
      }
    } catch { toast.error("Failed to save.") }
    finally { setSaving(null) }
  }

  if (!canView) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>
  }

  const grouped = works.reduce<Record<string, WorkItem[]>>((acc, w) => {
    const key = `${w.student?.full_name ?? "Unknown"} (${w.student?.email ?? ""})`
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  const totalGraded = works.filter((w) => w.status === "graded").length
  const totalSubmitted = works.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading</h1>
          <p className="text-sm text-muted-foreground">
            Review, score, and give feedback on student work
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Grade</Label>
          <select value={filterGrade} onChange={(e) => setFilterGrade(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="all">All</option>
          </select>
          <Badge variant="outline">{totalGraded}/{totalSubmitted} graded</Badge>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />))}
        </div>
      ) : works.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No submissions for Grade {filterGrade} with status "{filterStatus}".
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([studentName, items]) => {
            const student = items[0]?.student
            const allGraded = items.every((i) => i.status === "graded")
            return (
              <Card key={studentName}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{studentName}</span>
                      <Badge variant="outline" className="text-xs">G{student?.grade_assigned}</Badge>
                      {allGraded && <Badge className="bg-green-100 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">All Graded</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Avg: {items.some(i => i.score !== null) ? (items.reduce((s, i) => s + (i.score ?? 0), 0) / items.filter(i => i.score !== null).length).toFixed(1) : "—"}/10
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.question_type === "canvas" ? <Palette className="h-4 w-4 text-muted-foreground" /> : <BookOpen className="h-4 w-4 text-muted-foreground" />}
                            <p className="font-medium text-sm">{item.question_text}</p>
                            <Badge variant="outline" className="text-xs">{item.question_type}</Badge>
                            <Badge variant={item.status === "graded" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setShowAnswer((p) => ({ ...p, [item.id]: !p[item.id] }))} className="mt-1">
                            {showAnswer[item.id] ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                            {showAnswer[item.id] ? "Hide" : "Show"} Answer
                          </Button>
                          {showAnswer[item.id] && (
                            <div className="mt-2 rounded-lg bg-muted p-3">
                              {item.question_type === "canvas" ? (
                                item.canvas_data ? <img src={item.canvas_data as string} alt="Canvas drawing" className="max-w-xs rounded border" /> : <p className="text-xs text-muted-foreground">(blank canvas)</p>
                              ) : (
                                <pre className="text-sm whitespace-pre-wrap">{item.answer_text || "(no text answer)"}</pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Score (max {item.max_score})</Label>
                          <Input type="number" min={0} max={item.max_score} step={0.5}
                            value={scores[item.id] ?? ""}
                            onChange={(e) => setScores((p) => ({ ...p, [item.id]: e.target.value }))}
                            className="h-8 w-24" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Feedback</Label>
                          <Textarea value={feedbacks[item.id] ?? ""}
                            onChange={(e) => setFeedbacks((p) => ({ ...p, [item.id]: e.target.value }))}
                            rows={2} className="text-xs" />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleGrade(item.id)} disabled={saving === item.id}>
                          <Save className="mr-1 h-3 w-3" />{saving === item.id ? "Saving..." : "Grade"}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleGrade(item.id, true)} disabled={autoGradeLoading === item.id}>
                          <Sparkles className="mr-1 h-3 w-3" />{autoGradeLoading === item.id ? "AI Grading..." : "Auto-Grade"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
