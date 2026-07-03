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
import { CheckSquare, Square, Sparkles, Save, BookOpen, Palette, Search, Filter, Send, RotateCcw, Eye, X, Download, FileText } from "lucide-react"
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
  const [grade, setGrade] = useState(0) // 0 = all
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
        }
      }).catch(() => {})
  }, [canView, profile])

  useEffect(() => { if (canView) fetchData() }, [grade, canView])

  async function fetchData() {
    setLoading(true)
    try {
      const gradeParam = grade > 0 ? grade : "all"
      const res = await fetch(`/api/teacher/grading?grade=${gradeParam}&status=all`)
      const data = res.ok ? await res.json() : []
      setSubmissions(Array.isArray(data) ? data : [])
      const sm: Record<string, string> = {}
      const wsIds = new Set((data as any[]).filter((s: any) => s.worksheet_id).map((s: any) => s.worksheet_id))
      const syIds = new Set((data as any[]).filter((s: any) => s.syllabus_id).map((s: any) => s.syllabus_id))
      if (wsIds.size > 0) {
        const wsRes = await fetch(`/api/worksheets?ids=${Array.from(wsIds).join(",")}`)
        if (wsRes.ok) { const ws = await wsRes.json(); (Array.isArray(ws) ? ws : []).forEach((w: any) => { sm[`ws_${w.id}`] = w.title }) }
      }
      for (const id of syIds) {
        const syRes = await fetch(`/api/syllabus/documents/${id}`)
        if (syRes.ok) { const sy = await syRes.json(); sm[`sy_${id}`] = sy.file_name || "Syllabus" }
      }
      setSourceMap(sm)
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

  // ---- Review Modal with Annotation Tools ----
  const [annotationData, setAnnotationData] = useState<Record<string, string>>({})
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const [penColor, setPenColor] = useState("#22c55e")
  const [penSize, setPenSize] = useState(3)
  const [toolMode, setToolMode] = useState<"pen" | "eraser">("pen")
  const [drawing, setDrawing] = useState(false)
  const [totalManualScore, setTotalManualScore] = useState<string>("")

  function openReview(g: any) {
    setReviewItem(g)
    setAnnotationData({})
    setActiveItem(null)
    setPenColor("#22c55e")
    setPenSize(3)
    setToolMode("pen")
    setTotalManualScore(g.allGraded ? g.totalScore.toFixed(1) : "")
  }

  function closeReview() {
    setReviewItem(null)
    setAnnotationData({})
    setActiveItem(null)
    setTotalManualScore("")
  }

  function initAnnoCanvas(itemId: string, canvasImg: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = 800; canvas.height = 500
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 500)
      // Restore saved annotation
      const saved = annotationData[itemId]
      if (saved) {
        const savedImg = new Image()
        savedImg.onload = () => ctx.drawImage(savedImg, 0, 0, 800, 500)
        savedImg.src = saved
      }
    }
    img.src = canvasImg
  }

  function startDraw(e: React.MouseEvent, itemId: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    setDrawing(true)
    setActiveItem(itemId)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    ctx.beginPath()
    ctx.moveTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
  }

  function doDraw(e: React.MouseEvent, itemId: string) {
    if (!drawing || activeItem !== itemId) return
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (toolMode === "eraser") {
      ctx.clearRect((e.clientX - rect.left) * scaleX - penSize * 2, (e.clientY - rect.top) * scaleY - penSize * 2, penSize * 4, penSize * 4)
    } else {
      ctx.strokeStyle = penColor
      ctx.lineWidth = penSize * scaleX
      ctx.lineCap = "round"
      ctx.lineTo((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY)
      ctx.stroke()
    }
  }

  function stopDraw(e: React.MouseEvent, itemId: string) {
    if (!drawing) return
    setDrawing(false)
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    setAnnotationData(prev => ({ ...prev, [itemId]: canvas.toDataURL() }))
  }

  function clearAnno(itemId: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const item = reviewItem?.items.find((i: any) => i.id === itemId)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (item?.canvas_data) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, 800, 500)
      img.src = item.canvas_data as string
    }
    setAnnotationData(prev => { const n = { ...prev }; delete n[itemId]; return n })
  }

  // Distribute manual total score proportionally across items
  function distributeTotal(total: number) {
    if (!reviewItem) return
    const items = reviewItem.items
    const totalMax = items.reduce((s: number, i: any) => s + (i.max_score || 10), 0)
    if (totalMax === 0) return
    items.forEach((item: any, idx: number) => {
      const proportion = (item.max_score || 10) / totalMax
      const itemScore = Math.round(total * proportion * 10) / 10
      const clamped = Math.min(itemScore, item.max_score || 10)
      updateField(item.id, "_score", String(clamped))
    })
    setSubmissions(prev => [...prev])
  }

  function renderReview() {
    if (!reviewItem) return null
    const g = reviewItem
    const totalMax = g.items.reduce((s: number, i: any) => s + (i.max_score || 10), 0)
    const currentTotal = g.items.reduce((s: number, i: any) => {
      const v = parseFloat(i._score ?? i.score)
      return s + (isNaN(v) ? 0 : v)
    }, 0)

    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60" onClick={closeReview}>
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-900 min-h-screen mt-0" onClick={e => e.stopPropagation()}>

          {/* TOP BAR — sticky */}
          <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm">
            <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                  {g.student_name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <h2 className="font-bold text-sm">{g.student_name} <span className="text-muted-foreground font-normal text-xs">G{g.student_grade || "—"}</span></h2>
                  <p className="text-[11px] text-muted-foreground">{g.sourceLabel} · {g.items.length} page(s)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={closeReview}><X className="h-5 w-5" /></Button>
              </div>
            </div>

            {/* Score Bar + Actions */}
            <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 border">
                <span className="font-medium text-muted-foreground">Total</span>
                <Input type="number" min={0} max={totalMax} step={0.5} value={totalManualScore}
                  onChange={e => setTotalManualScore(e.target.value)}
                  onBlur={() => { if (totalManualScore) distributeTotal(parseFloat(totalManualScore)) }}
                  className="w-16 h-7 text-sm font-bold text-center" />
                <span className="text-muted-foreground">/ {totalMax.toFixed(0)}</span>
                <span className="ml-1 text-muted-foreground">(<strong>{currentTotal.toFixed(1)}</strong>)</span>
              </div>
              <select value={g.items[0]?._score_category ?? g.category ?? ""}
                onChange={e => g.items.forEach((i: any) => updateField(i.id, "_score_category", e.target.value))}
                className="h-7 text-[11px] rounded-md border border-input bg-background px-1.5">
                <option value="">Category...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex-1" />
              <Button size="sm" className="h-7 text-[11px]" onClick={() => saveGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Save className="mr-1 h-3 w-3" />{saving === g.key ? "..." : "Grade"}
              </Button>
              <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={() => autoGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Sparkles className="mr-1 h-3 w-3" />Auto
              </Button>
              {g.allGraded && (g.allReturned
                ? <Button size="sm" variant="outline" className="h-7 text-[11px] text-amber-600" onClick={async () => { await bulkPublish("unpublish", g); closeReview() }}><RotateCcw className="mr-1 h-3 w-3" />Unpub</Button>
                : <Button size="sm" className="h-7 text-[11px] bg-green-600 hover:bg-green-700" onClick={async () => { await bulkPublish("publish", g); closeReview() }} disabled={!g.category}><Send className="mr-1 h-3 w-3" />Pub</Button>
              )}
            </div>

            {/* Annotation Tools */}
            <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium text-muted-foreground">Annotate:</span>
              <button onClick={() => setToolMode("pen")} className={`px-2.5 py-1 rounded-md font-medium transition-colors ${toolMode === "pen" ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-green-100 dark:bg-gray-800 dark:hover:bg-green-900/30"}`}>✏️ Pen</button>
              <button onClick={() => setToolMode("eraser")} className={`px-2.5 py-1 rounded-md font-medium transition-colors ${toolMode === "eraser" ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900/30"}`}>🧹 Eraser</button>
              <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)} className="w-6 h-6 p-0.5 rounded cursor-pointer border" title="Color" />
              <select value={penSize} onChange={e => setPenSize(Number(e.target.value))} className="h-6 text-[10px] rounded border border-input bg-background px-1">
                <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={5}>5</option><option value={8}>8</option><option value={12}>12</option>
              </select>
              <span className="text-[10px] text-muted-foreground ml-auto">Click a page below to annotate</span>
            </div>
          </div>

          {/* STUDENT WORK — full-width layout like public page */}
          <div className="px-4 sm:px-6 py-6 space-y-10">
            {g.items.map((item: any, idx: number) => {
              const isCanvas = item.question_type === "canvas"
              const isActive = activeItem === item.id
              const scoreVal = item._score !== undefined ? item._score : (item.score ?? "")
              const fbVal = item._feedback !== undefined ? item._feedback : (item.feedback ?? "")
              return (
                <div key={item.id} className="space-y-3"
                  onClick={() => { setActiveItem(item.id); if (isCanvas) setTimeout(() => initAnnoCanvas(item.id, item.canvas_data as string), 50) }}>

                  {/* Page header like public page */}
                  <div className="flex items-center gap-3 border-b pb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">{isCanvas ? "Drawing" : "Written Answer"}</p>
                      {item.question_text && <p className="text-[11px] text-muted-foreground">{item.question_text}</p>}
                    </div>
                    <Badge variant="outline" className="text-[9px]">{item.status}</Badge>
                  </div>

                  {/* Answer display — full-width canvas or text */}
                  <div className={`bg-gray-50 rounded-lg overflow-hidden ${isActive ? "ring-2 ring-green-400" : "border"}`}>
                    {isCanvas ? (
                      item.canvas_data
                        ? <canvas ref={el => { canvasRefs.current[item.id] = el }}
                            className="w-full cursor-crosshair touch-none" style={{ aspectRatio: "800/500", maxHeight: 500 }}
                            onMouseDown={e => startDraw(e, item.id)}
                            onMouseMove={e => doDraw(e, item.id)}
                            onMouseUp={e => stopDraw(e, item.id)}
                            onMouseLeave={e => stopDraw(e, item.id)} />
                        : <div className="flex items-center justify-center h-40 text-xs text-muted-foreground">No drawing submitted</div>
                    ) : (
                      <pre className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed min-h-[60px]">
                        {item.answer_text || <span className="text-muted-foreground italic">(blank)</span>}
                      </pre>
                    )}
                  </div>

                  {/* Score + Feedback per page */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Score</Label>
                      <Input type="number" min={0} max={item.max_score || 10} step={0.5}
                        value={scoreVal} onChange={e => updateField(item.id, "_score", e.target.value)}
                        className="w-16 h-7 text-xs text-center" />
                      <span className="text-[10px] text-muted-foreground">/ {item.max_score || 10}</span>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                      <Textarea value={fbVal} onChange={e => updateField(item.id, "_feedback", e.target.value)}
                        rows={1} className="h-7 text-xs resize-none" placeholder="Feedback for this page..." />
                    </div>
                    {isActive && isCanvas && (
                      <Button size="sm" variant="ghost" className="h-6 text-[9px] text-muted-foreground" onClick={() => clearAnno(item.id)}>
                        Clear Annotations
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold">{g.student_name}</span>
              <span>·</span>
              <span>{g.sourceLabel}</span>
              <span>·</span>
              <span>{currentTotal.toFixed(1)}/{totalMax.toFixed(0)}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Save className="mr-1 h-4 w-4" />{saving === g.key ? "..." : "Grade All"}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => autoGrade(g.items.map((i: any) => i.id), g.key)} disabled={saving === g.key}>
                <Sparkles className="mr-1 h-4 w-4" />Auto
              </Button>
              {g.allGraded && (g.allReturned
                ? <Button size="sm" variant="outline" className="text-amber-600" onClick={async () => { await bulkPublish("unpublish", g); closeReview() }}><RotateCcw className="mr-1 h-4 w-4" />Unpublish</Button>
                : <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={async () => { await bulkPublish("publish", g); closeReview() }} disabled={!g.category}><Send className="mr-1 h-4 w-4" />Publish</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
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
          <p className="text-sm text-muted-foreground">Review, score, and publish student work</p>
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
                      {CATEGORIES.map(cat => (
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

      {/* Review Modal */}
      {renderReview()}
    </div>
  )
}
