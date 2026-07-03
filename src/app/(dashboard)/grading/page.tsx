"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckSquare, Square, Sparkles, Save, BookOpen, Palette, Search, ChevronDown, ChevronUp, Filter, Send, RotateCcw, Eye, X, Download, FileSpreadsheet, FileText } from "lucide-react"
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

export default function GradingPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const { profile } = useAuth()
  const canView = isSuperAdmin || isTeacher

  const [assignedGrades, setAssignedGrades] = useState<number[]>([...GRADES])
  const [grade, setGrade] = useState(10)
  const [filterCat, setFilterCat] = useState("all")
  const [submissions, setSubmissions] = useState<any[]>([])
  const [sourceMap, setSourceMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)
  const [reviewItem, setReviewItem] = useState<any>(null)
  const [saving, setSaving] = useState<string | null>(null)

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
      const sm: Record<string, string> = {}
      const wsIds = new Set((data as any[]).filter((s: any) => s.worksheet_id).map((s: any) => s.worksheet_id))
      const syIds = new Set((data as any[]).filter((s: any) => s.syllabus_id).map((s: any) => s.syllabus_id))
      if (wsIds.size > 0) {
        const wsRes = await fetch(`/api/worksheets?ids=${Array.from(wsIds).join(",")}`)
        if (wsRes.ok) { const ws = await wsRes.json(); (Array.isArray(ws) ? ws : []).forEach((w: any) => { sm[`ws_${w.id}`] = w.title }) }
      }
      if (syIds.size > 0) {
        for (const id of syIds) {
          const syRes = await fetch(`/api/syllabus/documents/${id}`)
          if (syRes.ok) { const sy = await syRes.json(); sm[`sy_${id}`] = sy.file_name || "Syllabus" }
        }
      }
      setSourceMap(sm)
    } catch {} finally { setLoading(false) }
  }

  function getSourceLabel(s: any): string {
    if (s.worksheet_id) return sourceMap[`ws_${s.worksheet_id}`] || "Worksheet"
    if (s.syllabus_id) return sourceMap[`sy_${s.syllabus_id}`] || "Syllabus"
    if (s.package_id) return s.question_text || "Weekly Work"
    return "Assignment"
  }

  // Group submissions by (worksheet_id|syllabus_id|package_id, student_id)
  const groups = useMemo(() => {
    const map = new Map<string, any[]>()
    for (const s of submissions) {
      const key = `${s.student_id}_${s.worksheet_id || s.syllabus_id || s.package_id || s.id}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      student_id: items[0].student_id,
      student_name: items[0].student?.full_name || "Unknown",
      sourceId: items[0].worksheet_id || items[0].syllabus_id || items[0].package_id,
      sourceType: items[0].worksheet_id ? "worksheet" : items[0].syllabus_id ? "syllabus" : "weekly",
      sourceLabel: getSourceLabel(items[0]),
      items,
      category: items.find((i: any) => i.score_category)?.score_category || "",
      totalScore: items.reduce((sum: number, i: any) => sum + (i.score || 0), 0),
      totalMax: items.reduce((sum: number, i: any) => sum + (i.max_score || 10), 0),
      allGraded: items.every((i: any) => i.status === "graded" || i.status === "returned"),
      allReturned: items.every((i: any) => i.status === "returned"),
      status: items.some((i: any) => i.status === "returned") ? "returned" : items.some((i: any) => i.status === "graded") ? "graded" : "submitted",
      submitted_at: items[0]?.submitted_at || "",
      published_at: items.find((i: any) => i.published_at)?.published_at || null,
    }))
  }, [submissions, sourceMap])

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

  function toggleSelectAll(ids: string[]) {
    setSelected(prev => {
      const all = ids.every(id => prev.has(id))
      if (all) { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n }
      const n = new Set(prev); ids.forEach(id => n.add(id)); return n
    })
  }

  async function handleBulkPublish(action: "publish" | "unpublish") {
    const ids: string[] = []
    for (const gid of Array.from(selected)) {
      const g = groups.find(x => x.key === gid)
      if (g) ids.push(...g.items.filter((i: any) => i.status === "graded" || (action === "unpublish" && i.status === "returned")).map((i: any) => i.id))
    }
    if (ids.length === 0) { toast.error("No eligible submissions selected"); return }
    setPublishing(true)
    try {
      const res = await fetch("/api/teacher/grading/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_ids: ids, action }),
      })
      if (res.ok) { toast.success(action === "publish" ? "Published!" : "Unpublished!"); setSelected(new Set()); fetchData() }
      else { const e = await res.json().catch(() => ({ error: "Error" })); toast.error(e.error) }
    } catch { toast.error("Error") }
    finally { setPublishing(false) }
  }

  async function updateField(workId: string, field: string, val: any) {
    setSubmissions(prev => prev.map(w => w.id === workId ? { ...w, [field]: val } : w))
  }

  async function handleGrade(submissionIds: string[], groupKey: string) {
    const g = groups.find(x => x.key === groupKey)
    if (!g) return
    setSaving(groupKey)
    let success = 0
    for (const workId of submissionIds) {
      const w = submissions.find((x: any) => x.id === workId)
      if (!w) continue
      const score = w._score !== undefined ? parseFloat(w._score) : (w.score ?? null)
      const feedback = w._feedback !== undefined ? w._feedback : (w.feedback ?? "")
      const cat = w._score_category ?? w.score_category ?? null
      try {
        const body: Record<string, unknown> = {}
        if (score !== null) body.score = score
        if (feedback) body.feedback = feedback
        if (cat) body.score_category = cat
        const res = await fetch(`/api/teacher/grading/${workId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Graded ${success}/${submissionIds.length} items`)
    setSaving(null)
    fetchData()
  }

  async function handleAutoGrade(submissionIds: string[], groupKey: string) {
    setSaving(groupKey)
    let success = 0
    for (const workId of submissionIds) {
      try {
        const w = submissions.find((x: any) => x.id === workId)
        const cat = w?._score_category ?? w?.score_category ?? undefined
        const body: Record<string, unknown> = {}
        if (cat) body.score_category = cat
        const res = await fetch(`/api/teacher/grading/${workId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Auto-graded ${success}/${submissionIds.length}`)
    setSaving(null)
    fetchData()
  }

  function getStatusBadge(g: any) {
    if (g.allReturned) return <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Published</Badge>
    if (g.allGraded) return <Badge variant="secondary" className="text-[10px]">Graded</Badge>
    if (g.status === "graded") return <Badge variant="secondary" className="text-[10px]">Partial</Badge>
    return <Badge variant="outline" className="text-[10px] text-amber-600">Submitted</Badge>
  }

  // ---- Review Modal ----
  const [annotationData, setAnnotationData] = useState<Record<string, string>>({})
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [activeAnnoPage, setActiveAnnoPage] = useState<number | null>(null)

  function openReview(g: any) {
    setReviewItem(g)
    setAnnotationData({})
    setActiveAnnoPage(null)
  }

  function closeReview() {
    setReviewItem(null)
    setAnnotationData({})
    setActiveAnnoPage(null)
  }

  function saveAnnotation(itemId: string) {
    const canvas = annotationCanvasRef.current
    if (!canvas) return
    setAnnotationData(prev => ({ ...prev, [itemId]: canvas.toDataURL() }))
  }

  function clearAnnotation() {
    const canvas = annotationCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "rgba(0,0,0,0)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  function startDraw(e: React.MouseEvent) {
    const canvas = annotationCanvasRef.current
    if (!canvas) return
    setDrawing(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  function doDraw(e: React.MouseEvent) {
    if (!drawing) return
    const canvas = annotationCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.strokeStyle = "#22c55e"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  function stopDraw() {
    setDrawing(false)
    const canvas = annotationCanvasRef.current
    if (!canvas || activeAnnoPage === null) return
    if (!reviewItem) return
    const item = reviewItem.items[activeAnnoPage]
    if (item) saveAnnotation(item.id)
  }

  function renderReview() {
    if (!reviewItem) return null
    const g = reviewItem
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4" onClick={closeReview}>
        <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-4 mt-8 mb-8" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 pb-2 border-b z-10">
            <div>
              <h2 className="text-lg font-bold">{g.student_name}</h2>
              <p className="text-xs text-muted-foreground">{g.sourceLabel} · {g.category || "No category"} · {g.items.length} item(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={closeReview}><X className="h-4 w-4" /></Button>
            </div>
          </div>

          {g.items.map((item: any, idx: number) => {
            const isCanvas = item.question_type === "canvas"
            const isActive = activeAnnoPage === idx
            return (
              <div key={item.id} className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">#{idx + 1} {item.question_text || item.question_id}</p>
                  <Badge variant="outline" className="text-[10px]">{isCanvas ? "Drawing" : "Text"} · {item.status}</Badge>
                </div>

                {/* Answer display */}
                {isCanvas ? (
                  <div className="relative">
                    {item.canvas_data ? (
                      <div className="relative inline-block border rounded-lg overflow-hidden">
                        <img src={item.canvas_data as string} alt="Student drawing" className="max-w-full" style={{ maxHeight: 400 }} />
                        <canvas ref={isActive ? annotationCanvasRef : undefined}
                          width={800} height={500}
                          className="absolute inset-0 cursor-crosshair"
                          style={isActive ? {} : { display: "none" }}
                          onMouseDown={isActive ? startDraw : undefined}
                          onMouseMove={isActive ? doDraw : undefined}
                          onMouseUp={isActive ? stopDraw : undefined}
                          onMouseLeave={isActive ? stopDraw : undefined} />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No drawing submitted</p>
                    )}
                    <div className="flex gap-1 mt-1">
                      <Button size="sm" variant="outline" className="h-6 text-[10px]"
                        onClick={() => setActiveAnnoPage(activeAnnoPage === idx ? null : idx)}>
                        <Palette className="mr-1 h-3 w-3" />{isActive ? "Hide Green Pen" : "✏️ Annotate (Green)"}
                      </Button>
                      {isActive && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={clearAnnotation}>
                          Clear Annotation
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <pre className="rounded bg-muted/50 p-3 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {item.answer_text || "(blank)"}
                  </pre>
                )}

                {/* Score + Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Score /{item.max_score || 10}</Label>
                    <Input type="number" min={0} max={item.max_score || 10} step={0.5}
                      value={item._score !== undefined ? item._score : (item.score ?? "")}
                      onChange={e => updateField(item.id, "_score", e.target.value)}
                      className="h-8 text-xs" />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[10px]">Feedback</Label>
                    <Textarea value={item._feedback !== undefined ? item._feedback : (item.feedback ?? "")}
                      onChange={e => updateField(item.id, "_feedback", e.target.value)}
                      rows={1} className="h-8 text-xs resize-none" placeholder="Feedback..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Category</Label>
                    <select value={item._score_category ?? item.score_category ?? ""}
                      onChange={e => updateField(item.id, "_score_category", e.target.value)}
                      className="h-8 text-xs rounded-md border border-input bg-background px-2 w-full">
                      <option value="">Select...</option>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="flex items-center justify-between sticky bottom-0 bg-white dark:bg-gray-900 pt-2 border-t">
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Save className="mr-1 h-4 w-4" />{saving === g.key ? "..." : "Grade All"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleAutoGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Sparkles className="mr-1 h-4 w-4" />Auto All
              </Button>
            </div>
            <div className="flex gap-2">
              {g.allGraded && (
                g.allReturned
                  ? <Button size="sm" variant="outline" className="text-amber-600" onClick={async () => { await handleBulkPublish("unpublish"); closeReview() }} disabled={publishing}><RotateCcw className="mr-1 h-4 w-4" />Cancel Publish</Button>
                  : <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => { await handleBulkPublish("publish"); closeReview() }} disabled={publishing || !g.category}><Send className="mr-1 h-4 w-4" />Publish All</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---- Export helpers ----
  function exportCSV() {
    const rows: string[][] = [["Student", "Source", "Type", "Score", "Max", "Status", "Submitted"]]
    for (const g of filteredGroups) {
      rows.push([g.student_name, g.sourceLabel, g.category || "-", g.totalScore.toFixed(1), g.totalMax.toFixed(0), g.status, new Date(g.submitted_at).toLocaleDateString()])
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `grading-grade-${grade}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!canView) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Grading Center</h1>
          <p className="text-sm text-muted-foreground">Review, score, and publish student submissions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={grade} onChange={e => setGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium">
              {assignedGrades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="all">All Types</option>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
          onClick={() => handleBulkPublish("publish")} disabled={publishing || selected.size === 0}>
          <Send className="mr-1 h-3 w-3" />Publish Selected
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs text-amber-600 border-amber-300"
          onClick={() => handleBulkPublish("unpublish")} disabled={publishing || selected.size === 0}>
          <RotateCcw className="mr-1 h-3 w-3" />Unpublish
        </Button>
        <div className="flex-1" />
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
            className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}</div>
      ) : filteredGroups.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">
          {submissions.length === 0 ? `No submissions for Grade ${grade}.` : "No submissions match filters."}
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
                <th className="p-3 text-left font-medium text-xs text-muted-foreground uppercase">Source</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Type</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Score</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Items</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Status</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Published</th>
                <th className="p-3 text-center font-medium text-xs text-muted-foreground uppercase">Review</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g) => {
                const rowCat = g.items.find((i: any) => i._score_category)?.score_category || g.category
                const rowScore = g.items.every((i: any) => i._score !== undefined || i.score !== null)
                  ? g.items.reduce((s: number, i: any) => s + (parseFloat(i._score ?? i.score) || 0), 0)
                  : null
                const rowMax = g.items.reduce((s: number, i: any) => s + (i.max_score || 10), 0)
                return (
                <tr key={g.key} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <button onClick={() => toggleSelect(g.key)}>
                      {selected.has(g.key) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </td>
                  <td className="p-3 font-medium">{g.student_name}</td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[160px] truncate">{g.sourceLabel}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {CATEGORIES.map(cat => (
                        <button key={cat.value}
                          onClick={async () => {
                            const newCat = g.category === cat.value ? "" : cat.value
                            for (const item of g.items) {
                              updateField(item.id, "_score_category", newCat)
                              await fetch(`/api/teacher/grading/${item.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ score_category: newCat || null }),
                              })
                            }
                            toast.success(newCat ? `Set ${cat.label}` : "Category cleared")
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
                    <div className="flex items-center justify-center gap-1">
                      <input type="number" min={0} max={rowMax} step={0.5}
                        value={g.items.map((i: any) => i._score ?? i.score ?? "").join(",")}
                        onChange={e => {
                          const vals = e.target.value.split(",")
                          g.items.forEach((item: any, idx: number) => {
                            const v = vals[idx]
                            if (v !== undefined) updateField(item.id, "_score", v)
                          })
                          setSubmissions(prev => [...prev])
                        }}
                        className="w-14 h-7 text-xs text-center rounded border border-input bg-background" />
                      <span className="text-[10px] text-muted-foreground">/{rowMax}</span>
                    </div>
                    <div className="flex gap-1 mt-1 justify-center">
                      <Button size="sm" variant="outline" className="h-5 text-[9px] px-1.5"
                        onClick={() => handleGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                        <Save className="h-2.5 w-2.5 mr-0.5" />Grade
                      </Button>
                      <Button size="sm" variant="outline" className="h-5 text-[9px] px-1.5"
                        onClick={() => handleAutoGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" />Auto
                      </Button>
                    </div>
                  </td>
                  <td className="p-3 text-center text-xs text-muted-foreground">{g.items.length}</td>
                  <td className="p-3 text-center">{getStatusBadge(g)}</td>
                  <td className="p-3 text-center">
                    {g.allGraded && (
                      g.allReturned
                        ? <Button size="sm" variant="outline" className="h-6 text-[9px] px-1.5 text-amber-600"
                            onClick={async () => { await handleBulkPublish("unpublish"); fetchData() }} disabled={publishing}>
                            <RotateCcw className="h-2.5 w-2.5 mr-0.5" />Unpub
                          </Button>
                        : <Button size="sm" className="h-6 text-[9px] px-1.5 bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => { await handleBulkPublish("publish"); fetchData() }} disabled={publishing || !g.category}>
                            <Send className="h-2.5 w-2.5 mr-0.5" />Pub
                          </Button>
                    )}
                    {g.published_at && <p className="text-[9px] text-green-600 mt-0.5">{new Date(g.published_at).toLocaleDateString()}</p>}
                  </td>
                  <td className="p-3 text-center">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openReview(g)}>
                      <Eye className="mr-1 h-3 w-3" />Review
                    </Button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {renderReview()}
    </div>
  )
}
