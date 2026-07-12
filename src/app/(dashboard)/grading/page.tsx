"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckSquare, Square, Sparkles, Save, BookOpen, Palette, Search, Filter, Send, RotateCcw, Eye, Download, FileText } from "lucide-react"
import { GRADES, SUBJECTS } from "@/lib/utils/constants"
import toast from "react-hot-toast"

import { getCategoryOptions } from "@/lib/syllabus/assessment-weights"

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const { profile } = useAuth()
  const canView = isSuperAdmin || isTeacher
  const router = useRouter()

  const [assignedGrades, setAssignedGrades] = useState<number[]>([...GRADES])
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])
  const [grade, setGrade] = useState(0) // 0 = all
  const [filterCat, setFilterCat] = useState("all")
  const [subjectFilter, setSubjectFilter] = useState("all")
  const [submissions, setSubmissions] = useState<any[]>([])
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({})
  const [maxScoreMap, setMaxScoreMap] = useState<Record<string, number>>({})
  const [catOpts, setCatOpts] = useState<{ value: string; label: string }[]>([
    { value: "classwork", label: "Classwork" },
    { value: "unit_test", label: "Unit Test" },
    { value: "project", label: "Project" },
    { value: "homework", label: "Homework" },
    { value: "mid_semester", label: "Mid Semester" },
    { value: "final_semester", label: "Final Semester" },
  ])

  useEffect(() => {
    if (!grade) return
    fetch(`/api/assessment-weights?grade=${grade}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (data.length > 0) {
          setCatOpts(data.map((d: any) => ({
            value: d.category,
            label: `${d.category.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} (${Math.round(d.weight * 100)}%)`,
          })))
        }
      })
      .catch(() => {})
  }, [grade])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!canView || !profile?.id) return
    fetch(`/api/teacher/grading/assignments?teacher_id=${profile.id}`)
      .then(r => r.json()).then((data: any[]) => {
        if (Array.isArray(data) && data.length) {
          const grades = [...new Set(data.map((a: any) => a.grade))].sort()
          const subjects = [...new Set(data.map((a: any) => a.subject).filter(Boolean))]
          setAssignedGrades(grades)
          setAssignedSubjects(subjects)
        }
      }).catch(() => {})
  }, [canView, profile])

  useEffect(() => { if (canView) fetchData() }, [grade, canView, subjectFilter])

  async function fetchData() {
    setLoading(true)
    try {
      const gradeParam = grade > 0 ? grade : "all"
      const subjectParam = subjectFilter !== "all" ? `&subject=${subjectFilter}` : ""
      const res = await fetch(`/api/teacher/grading?grade=${gradeParam}&status=all${subjectParam}`)
      const data = res.ok ? await res.json() : []
      setSubmissions(Array.isArray(data) ? data : [])
      const sm: Record<string, string> = {}
      const mm: Record<string, number> = {}
      const wsIds = new Set((data as any[]).filter((s: any) => s.worksheet_id).map((s: any) => s.worksheet_id))
      const syIds = new Set((data as any[]).filter((s: any) => s.syllabus_id).map((s: any) => s.syllabus_id))
      if (wsIds.size > 0) {
        const wsRes = await fetch(`/api/worksheets?ids=${Array.from(wsIds).join(",")}`)
        if (wsRes.ok) { const ws = await wsRes.json(); (Array.isArray(ws) ? ws : []).forEach((w: any) => { sm[`ws_${w.id}`] = w.title; if (w.max_score) mm[`ws_${w.id}`] = w.max_score }) }
      }
      for (const id of syIds) {
        const syRes = await fetch(`/api/syllabus/plan/${id}`)
        if (syRes.ok) { const sy = await syRes.json(); sm[`sy_${id}`] = `Grade ${sy.grade} Week ${sy.week_number}` || "Syllabus"; if (sy.max_score) mm[`sy_${id}`] = sy.max_score }
      }
      setSourceMap(sm)
      setMaxScoreMap(mm)
    } catch {} finally { setLoading(false) }
  }

  function getSourceLabel(s: any): string {
    if (s.worksheet_id) return sourceMap[`ws_${s.worksheet_id}`] || "Worksheet"
    if (s.syllabus_id) return sourceMap[`sy_${s.syllabus_id}`] || "Syllabus"
    return s.question_text || "Assignment"
  }

  const groups = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const s of submissions) {
      const key = `${s.student_id}_${s.worksheet_id || s.syllabus_id || s.package_id || s.id}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key, student_id: items[0].student_id,
      student_name: items[0].student?.full_name || "Unknown",
      student_grade: items[0].student?.grade_assigned || "",
      sourceId: items[0].worksheet_id || items[0].syllabus_id || items[0].package_id,
      sourceType: items[0].worksheet_id ? "worksheet" : items[0].syllabus_id ? "syllabus" : "weekly",
      sourceLabel: getSourceLabel(items[0]),
      items, category: items.find((i: any) => i.score_category)?.score_category || "",
      totalScore: items.reduce((sum: number, i: any) => sum + (i.score || 0), 0),
      totalMax: (() => {
        const first = items[0]
        const sourceKey = first.worksheet_id ? `ws_${first.worksheet_id}` : first.syllabus_id ? `sy_${first.syllabus_id}` : null
        return sourceKey && maxScoreMap[sourceKey] ? maxScoreMap[sourceKey] : items.reduce((sum: number, i: any) => sum + (i.max_score || 10), 0)
      })(),
      allGraded: items.every((i: any) => i.status === "graded" || i.status === "returned"),
      allReturned: items.every((i: any) => i.status === "returned"),
      status: items.some((i: any) => i.status === "returned") ? "returned" : items.some((i: any) => i.status === "graded") ? "graded" : "submitted",
      submitted_at: items[0]?.submitted_at || "",
      published_at: items.find((i: any) => i.published_at)?.published_at || null,
    }))
  }, [submissions, sourceMap, maxScoreMap])

  const filteredGroups = useMemo(() => {
    return groups.filter(g => {
      if (filterCat !== "all" && g.category !== filterCat) return false
      if (search && !g.student_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [groups, filterCat, search])

  const totalGroups = groups.length
  const gradedGroups = groups.filter(g => g.allGraded).length
  const returnedGroups = groups.filter(g => g.allReturned).length
  const ungradedGroups = groups.filter(g => g.status === "submitted").length

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  function updateField(workId: string, field: string, val: any) {
    setSubmissions(prev => prev.map(w => w.id === workId ? { ...w, [field]: val } : w))
  }

  async function saveGrade(workIds: string[], groupKey: string) {
    setSaving(groupKey)
    let success = 0
    for (const workId of workIds) {
      const w = submissions.find((x: any) => x.id === workId)
      if (!w) continue
      try {
        const body: Record<string, unknown> = {}
        if (w._score !== undefined) body.score = parseFloat(w._score)
        else if (w.score !== null) body.score = w.score
        if (w._feedback !== undefined) body.feedback = w._feedback
        else if (w.feedback) body.feedback = w.feedback
        if (w._score_category) body.score_category = w._score_category
        else if (w.score_category) body.score_category = w.score_category
        const res = await fetch(`/api/teacher/grading/${workId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Graded ${success}/${workIds.length}`)
    setSaving(null)
    fetchData()
  }

  async function autoGrade(workIds: string[], groupKey: string) {
    setSaving(groupKey)
    let success = 0
    for (const workId of workIds) {
      try {
        const w = submissions.find((x: any) => x.id === workId)
        const body: Record<string, unknown> = {}
        const cat = w?._score_category ?? w?.score_category
        if (cat) body.score_category = cat
        const res = await fetch(`/api/teacher/grading/${workId}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Auto-graded ${success}/${workIds.length}`)
    setSaving(null)
    fetchData()
  }

  function getStatusBadge(g: any) {
    if (g.allReturned) return <Badge className="text-[10px] bg-green-100 text-green-700">Published</Badge>
    if (g.allGraded) return <Badge variant="secondary" className="text-[10px]">Graded</Badge>
    if (g.status === "graded") return <Badge variant="secondary" className="text-[10px]">Partial</Badge>
    return <Badge variant="outline" className="text-[10px] text-amber-600">Submitted</Badge>
  }

  function openReview(g: any) {
    const params = new URLSearchParams({
      sourceType: g.sourceType,
      sourceId: g.sourceId,
      studentId: g.student_id,
      studentName: g.student_name,
      studentGrade: String(g.student_grade || ""),
    })
    router.push(`/grading/review?${params.toString()}`)
  }



  async function bulkPublish(action: "publish" | "unpublish", g?: any) {
    const groupsToProcess = g ? [g] : groups.filter(g => selected.has(g.key))
    if (groupsToProcess.length === 0) { toast.error("Select submissions first"); return }
    setPublishing(true)
    let totalPublished = 0
    for (const grp of groupsToProcess) {
      const ids = grp.items.filter((i: any) => i.status === "graded" || (action === "unpublish" && i.status === "returned")).map((i: any) => i.id)
      if (ids.length === 0) continue
      try {
        const res = await fetch("/api/teacher/grading/publish", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission_ids: ids, action }),
        })
        if (res.ok) totalPublished += ids.length
      } catch {}
    }
    toast.success(`${action === "publish" ? "Published" : "Unpublished"} ${totalPublished}`)
    setPublishing(false)
    setSelected(new Set())
    fetchData()
  }

  function exportCSV() {
    const rows: string[][] = [["Student", "Grade", "Source", "Type", "Score", "Max", "Status", "Submitted"]]
    for (const g of filteredGroups) {
      rows.push([g.student_name, String(g.student_grade || ""), g.sourceLabel, g.category || "-", g.totalScore.toFixed(1), g.totalMax.toFixed(0), g.status, new Date(g.submitted_at).toLocaleDateString()])
    }
    const csv = rows.map(r => `"${r.join('","')}"`).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `grading${grade > 0 ? `-grade-${grade}` : "-all"}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading Center</h1>
          <p className="text-sm text-muted-foreground">Review and grade student submissions. Filter by grade and subject, assign scores and feedback, set assessment categories, and publish or unpublish results to students.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={grade} onChange={e => setGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium">
              <option value={0}>📋 All Grades</option>
              {assignedGrades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Types</option>
              {catOpts.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Subjects</option>
              {(assignedSubjects.length > 0
                ? SUBJECTS.filter(s => assignedSubjects.includes(s.code))
                : SUBJECTS
              ).map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm items-center">
        <Badge variant="outline" className="text-xs px-3 py-1">{totalGroups} submissions</Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1">{gradedGroups} graded</Badge>
        <Badge variant="default" className="text-xs px-3 py-1">{returnedGroups} returned</Badge>
        {ungradedGroups > 0 && <Badge variant="outline" className="text-xs px-3 py-1 text-amber-600">{ungradedGroups} ungraded</Badge>}
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={exportCSV}>
          <Download className="mr-1 h-3 w-3" />CSV
        </Button>
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="default" className="h-7 text-xs bg-green-600 hover:bg-green-700"
          onClick={() => bulkPublish("publish")} disabled={publishing || selected.size === 0}>
          <Send className="mr-1 h-3 w-3" />Publish Selected
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-300"
          onClick={() => bulkPublish("unpublish")} disabled={publishing || selected.size === 0}>
          <RotateCcw className="mr-1 h-3 w-3" />Unpublish
        </Button>
        <div className="flex-1" />
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filteredGroups.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          {submissions.length === 0 ? "No submissions found." : "No submissions match filters."}
        </CardContent></Card>
      ) : (
        /* Table */
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="p-3 text-left w-8">
                  <button onClick={() => {
                    const allKeys = filteredGroups.map(g => g.key)
                    if (allKeys.every(k => selected.has(k))) { const n = new Set(selected); allKeys.forEach(k => n.delete(k)); setSelected(n) }
                    else { const n = new Set(selected); allKeys.forEach(k => n.add(k)); setSelected(n) }
                  }}>
                    <Square className="h-4 w-4 text-muted-foreground" />
                  </button>
                </th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground uppercase">Student</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground uppercase">Gr</th>
                <th className="p-3 text-left font-medium text-xs text-muted-foreground uppercase">Source</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Type</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Score</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Status</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => {
                const rowCat = g.items.find((i: any) => i._score_category)?.score_category || g.category
                return (
                <tr key={g.key} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <button onClick={() => toggleSelect(g.key)}>
                      {selected.has(g.key) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="p-3 font-medium">{g.student_name}</td>
                  <td className="p-3 text-xs text-muted-foreground">{g.student_grade || "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[160px] truncate">{g.sourceLabel}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {catOpts.map(cat => (
                        <button key={cat.value}
                          onClick={async () => {
                            const newCat = g.category === cat.value ? "" : cat.value
                            for (const item of g.items) {
                              updateField(item.id, "_score_category", newCat)
                              await fetch(`/api/teacher/grading/${item.id}`, {
                                method: "PUT", headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ score_category: newCat || null }),
                              })
                            }
                            toast.success(newCat ? `Set ${cat.label}` : "Cleared")
                            fetchData()
                          }}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium transition-colors ${
                            g.category === cat.value || rowCat === cat.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-input hover:bg-accent"
                          }`}>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {g.allGraded
                      ? <span className="font-mono text-sm font-semibold text-green-600">{g.totalScore.toFixed(1)}/{g.totalMax.toFixed(0)}</span>
                      : <span className="text-[10px] text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-center">{getStatusBadge(g)}</td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openReview(g)}>
                        <Eye className="mr-1 h-3 w-3" />Review
                      </Button>
                      <div className="flex gap-1">
                        {g.allGraded && !g.allReturned && (
                          <Button size="sm" className="h-5 text-[8px] px-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => { await bulkPublish("publish", g); fetchData() }} disabled={publishing || !g.category}>
                            <Send className="h-2.5 w-2.5 mr-0.5" />Pub
                          </Button>
                        )}
                        {g.allReturned && (
                          <Button size="sm" variant="outline" className="h-5 text-[8px] px-1 text-amber-600"
                            onClick={async () => { await bulkPublish("unpublish", g); fetchData() }} disabled={publishing}>
                            <RotateCcw className="h-2.5 w-2.5 mr-0.5" />Unpub
                          </Button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
