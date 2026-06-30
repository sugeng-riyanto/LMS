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
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Send, Sparkles, Save, Eye, EyeOff, GraduationCap, BookOpen, Palette, BarChart3, PieChart, TrendingUp, Users, Search, Download, Filter } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

const CATEGORIES = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"] as const
const CAT_LABELS: Record<string, string> = { classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester" }
const CAT_WEIGHTS: Record<string, number> = { classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1 }
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"]

interface StudentSummary {
  id: string; full_name: string; grade_assigned: number
  scores: Record<string, number>
  counts: Record<string, number>
  feedbacks: Record<string, string>
  workIds: Record<string, string>
  weightedTotal: number
}

function getGradeColor(s: number) { return s >= 80 ? "text-green-600" : s >= 60 ? "text-amber-600" : s >= 40 ? "text-orange-600" : "text-red-600" }

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canView = isSuperAdmin || isTeacher

  const [filterGrade, setFilterGrade] = useState(10)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentSummary[]>([])
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({})
  const [rawWorks, setRawWorks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("table")
  const [searchTerm, setSearchTerm] = useState("")
  const [savingAll, setSavingAll] = useState(false)

  useEffect(() => { if (canView) fetchAll() }, [filterGrade])

  async function fetchAll() {
    setLoading(true)
    try {
      const works = await (await fetch(`/api/teacher/grading?grade=${filterGrade}&status=all`)).json()
      setRawWorks(works)

      const allProfiles = await (await fetch("/api/profiles")).json().catch(() => [])
      const gradeProfiles = (Array.isArray(allProfiles) ? allProfiles : [])
        .filter((p: any) => p.role === "student" && (p.grade_assigned === filterGrade))

      const summary: Record<string, StudentSummary> = {}
      gradeProfiles.forEach((p: any) => {
        const sid = p.id
        summary[sid] = {
          id: sid, full_name: p.full_name ?? "Unknown", grade_assigned: p.grade ?? p.grade_assigned ?? filterGrade,
          scores: {}, counts: {}, feedbacks: {}, workIds: {},
          weightedTotal: 0,
        }
        CATEGORIES.forEach((c) => { summary[sid].scores[c] = 0; summary[sid].counts[c] = 0; summary[sid].feedbacks[c] = "" })
      })

      works.forEach((w: any) => {
        const s = summary[w.student_id]
        if (!s) return
        const cat = w.score_category ?? "classwork"
        if (w.score !== null && w.score !== undefined) {
          s.scores[cat] = (s.scores[cat] ?? 0) + w.score
          s.counts[cat] = (s.counts[cat] ?? 0) + 1
        }
        if (w.feedback && !s.feedbacks[cat]) s.feedbacks[cat] = w.feedback
        if (w.id && !s.workIds[cat]) s.workIds[cat] = w.id
      })

      Object.values(summary).forEach((s) => {
        let total = 0
        CATEGORIES.forEach((c) => {
          if (s.counts[c] > 0) s.scores[c] = s.scores[c] / s.counts[c]
          total += s.scores[c] * CAT_WEIGHTS[c]
        })
        s.weightedTotal = Math.round(total * 10) / 10
      })

      setStudents(Object.values(summary))
    } catch { toast.error("Failed to load") }
    finally { setLoading(false) }
  }

  async function handleGradeStudent(studentId: string) {
    const s = students.find((st) => st.id === studentId)
    if (!s) return
    setSavingAll(true)
    let saved = 0
    for (const cat of CATEGORIES) {
      const workId = s.workIds[cat]
      if (!workId) continue
      try {
        const res = await fetch(`/api/teacher/grading/${workId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: s.scores[cat], feedback: s.feedbacks[cat] }),
        })
        if (res.ok) saved++
      } catch {}
    }
    setSavingAll(false)
    toast.success(`${saved} categories graded for ${s.full_name}`)
  }

  async function handleAutoGrade(studentId: string) {
    const s = students.find((st) => st.id === studentId)
    if (!s) return
    setSavingAll(true)
    for (const cat of CATEGORIES) {
      const workId = s.workIds[cat]
      if (!workId) continue
      try {
        await fetch(`/api/teacher/grading/${workId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      } catch {}
    }
    setSavingAll(false)
    toast.success(`Auto-graded ${s.full_name}`)
    fetchAll()
  }

  function updateStudentScore(id: string, cat: string, val: string) {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, scores: { ...s.scores, [cat]: parseFloat(val) || 0 }, weightedTotal: recalcWeighted({ ...s.scores, [cat]: parseFloat(val) || 0 }, { ...s.counts }) } : s))
  }

  function updateStudentFeedback(id: string, cat: string, val: string) {
    setStudents((prev) => prev.map((s) => s.id === id ? { ...s, feedbacks: { ...s.feedbacks, [cat]: val } } : s))
  }

  function recalcWeighted(scores: Record<string, number>, counts: Record<string, number>): number {
    let total = 0
    CATEGORIES.forEach((c) => { if (counts[c] > 0) total += (scores[c] ?? 0) * CAT_WEIGHTS[c] })
    return Math.round(total * 10) / 10
  }

  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  const allGraded = filtered.every((s) => Object.values(s.scores).every((v) => v > 0))
  const avgWeighted = filtered.length > 0 ? filtered.reduce((sum, s) => sum + s.weightedTotal, 0) / filtered.length : 0

  // Chart data
  const histRanges = ["0-20", "21-40", "41-60", "61-80", "81-100"]
  const histData = histRanges.map((r) => {
    const [min, max] = r.split("-").map(Number)
    return { range: r, count: filtered.filter((s) => s.weightedTotal >= min && s.weightedTotal <= max).length }
  })
  const maxHist = Math.max(...histData.map((h) => h.count), 1)

  const pieData = CATEGORIES.map((c, i) => {
    const avg = filtered.length > 0 ? filtered.reduce((s, st) => s + (st.scores[c] ?? 0), 0) / filtered.length : 0
    return { label: CAT_LABELS[c], value: Math.round(avg * 10) / 10, color: COLORS[i] }
  })

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading Center</h1>
          <p className="text-sm text-muted-foreground">Grade student work, manage scores, and track progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Grade</Label>
          <select value={filterGrade} onChange={(e) => setFilterGrade(Number(e.target.value))} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
          </select>
          <Badge variant="outline" className="text-xs">{filtered.length} students</Badge>
          <Badge className={avgWeighted >= 60 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{avgWeighted.toFixed(1)}% avg</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="table"><GraduationCap className="mr-1 h-4 w-4" />Grading Table</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="mr-1 h-4 w-4" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search student..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs h-8 text-sm" />
          </div>

          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />))}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No students or submissions for Grade {filterGrade}.</CardContent></Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium sticky left-0 bg-muted/50">Student</th>
                    {CATEGORIES.map((c) => (<th key={c} className="p-2 text-center font-medium min-w-[100px]">{CAT_LABELS[c]}<br /><span className="text-[10px] text-muted-foreground">({(CAT_WEIGHTS[c] * 100).toFixed(0)}%)</span></th>))}
                    <th className="p-2 text-center font-medium min-w-[80px]">Weighted</th>
                    <th className="p-2 text-center font-medium min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium sticky left-0 bg-background">{student.full_name}</td>
                      {CATEGORIES.map((cat) => (
                        <td key={cat} className="p-2 text-center">
                          {student.counts[cat] > 0 ? (
                            <div className="space-y-1">
                              <Input type="number" min={0} max={100} step={0.5}
                                value={student.scores[cat] ?? ""}
                                onChange={(e) => updateStudentScore(student.id, cat, e.target.value)}
                                className="h-7 w-20 text-center text-xs mx-auto" />
                              <Textarea value={student.feedbacks[cat] ?? ""}
                                onChange={(e) => updateStudentFeedback(student.id, cat, e.target.value)}
                                rows={1} className="h-7 text-[10px] resize-none" placeholder="feedback..." />
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      ))}
                      <td className={`p-2 text-center font-bold text-lg ${getGradeColor(student.weightedTotal)}`}>{student.weightedTotal.toFixed(1)}%</td>
                      <td className="p-2 text-center">
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleGradeStudent(student.id)} disabled={savingAll}>
                            <Save className="mr-1 h-3 w-3" />Grade
                          </Button>
                          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => handleAutoGrade(student.id)} disabled={savingAll}>
                            <Sparkles className="mr-1 h-3 w-3" />Auto
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Pie + Histogram */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4" />Average by Category</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <svg viewBox="0 0 100 100" className="w-40 h-40 shrink-0">
                    {(() => {
                      const total = pieData.reduce((s, d) => s + d.value, 0) || 1
                      let cum = 0
                      return pieData.map((d, i) => {
                        const start = (cum / total) * 360; cum += d.value; const end = (cum / total) * 360
                        const r = 40, cx = 50, cy = 50
                        const sr = ((start - 90) * Math.PI) / 180, er = ((end - 90) * Math.PI) / 180
                        const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr)
                        const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er)
                        return <path key={i} d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={d.color} stroke="#fff" strokeWidth={1} />
                      })
                    })()}
                    <circle cx={50} cy={50} r={25} fill="#fff" />
                    <text x={50} y={48} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#1a1a2e">{(pieData.reduce((s, d) => s + d.value, 0) / pieData.length).toFixed(0)}%</text>
                    <text x={50} y={60} textAnchor="middle" fontSize={6} fill="#64748b">avg</text>
                  </svg>
                  <div className="space-y-1">
                    {pieData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                        <span className="w-20 text-muted-foreground">{d.label}</span>
                        <span className="font-medium">{d.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Score Distribution (Histogram)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {histData.map((h) => (
                    <div key={h.range} className="flex items-center gap-3">
                      <span className="w-14 text-xs text-muted-foreground">{h.range}%</span>
                      <div className="flex-1 rounded-full bg-muted h-6">
                        <div className="h-6 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                          style={{ width: `${(h.count / maxHist) * 100}%`, backgroundColor: h.count > maxHist * 0.7 ? "#3b82f6" : h.count > maxHist * 0.3 ? "#22c55e" : "#f59e0b", minWidth: h.count > 0 ? "2rem" : "0" }}>
                          {h.count > 0 && h.count}
                        </div>
                      </div>
                      <span className="w-8 text-right text-xs font-medium">{h.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Student Cards */}
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Individual Progress</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data.</p>
              ) : (
                filtered.map((s) => (
                  <div key={s.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{s.full_name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getGradeColor(s.weightedTotal)}`}>{s.weightedTotal.toFixed(1)}%</span>
                        <div className="w-20 rounded-full bg-muted h-2">
                          <div className="h-2 rounded-full" style={{ width: `${s.weightedTotal}%`, backgroundColor: s.weightedTotal >= 60 ? "#22c55e" : "#ef4444" }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((c) => (
                        s.counts[c] > 0 ? (
                          <Badge key={c} variant="outline" className="text-xs">
                            {CAT_LABELS[c]}: {s.scores[c].toFixed(1)}%
                          </Badge>
                        ) : null
                      ))}
                    </div>
                    {s.feedbacks && Object.values(s.feedbacks).some(Boolean) && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {Object.entries(s.feedbacks).filter(([, v]) => v).map(([k, v]) => (
                          <p key={k}><strong>{CAT_LABELS[k]}:</strong> {v}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
