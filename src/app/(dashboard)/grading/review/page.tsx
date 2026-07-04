"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Save, Sparkles, Send, RotateCcw, ArrowLeft, X } from "lucide-react"
import toast from "react-hot-toast"

const CATEGORIES = [
  { value: "classwork", label: "Classwork", weight: "40%" },
  { value: "unit_test", label: "Unit Test", weight: "20%" },
  { value: "project", label: "Project", weight: "10%" },
  { value: "homework", label: "Homework", weight: "10%" },
  { value: "mid_semester", label: "Mid Semester", weight: "10%" },
  { value: "final_semester", label: "Final Semester", weight: "10%" },
]

export default function GradingReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sourceType = searchParams.get("sourceType") || ""
  const sourceId = searchParams.get("sourceId") || ""
  const studentId = searchParams.get("studentId") || ""
  const studentName = searchParams.get("studentName") || "Student"
  const studentGrade = searchParams.get("studentGrade") || ""

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceTitle, setSourceTitle] = useState("")
  const [saving, setSaving] = useState<string | null>(null)
  const [toolMode, setToolMode] = useState<"pen" | "eraser">("pen")
  const [penColor, setPenColor] = useState("#22c55e")
  const [penSize, setPenSize] = useState(3)
  const [drawing, setDrawing] = useState(false)
  const [activeItem, setActiveItem] = useState<string | null>(null)
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [totalManualScore, setTotalManualScore] = useState("")
  const [category, setCategory] = useState("")

  useEffect(() => {
    if (!sourceId || !studentId) return
    fetch(`/api/teacher/grading?grade=all&status=all`)
      .then(r => r.json())
      .then((data: any[]) => {
        const filtered = data.filter((s: any) =>
          (s.worksheet_id === sourceId || s.syllabus_id === sourceId) &&
          s.student_id === studentId
        )
        setItems(filtered)
        const cat = filtered.find((i: any) => i.score_category)?.score_category || ""
        setCategory(cat)
        const allGraded = filtered.every((i: any) => i.status === "graded" || i.status === "returned")
        if (allGraded) {
          const total = filtered.reduce((sum, i) => sum + (i.score || 0), 0)
          setTotalManualScore(total.toFixed(1))
        }
        if (filtered.length > 0) {
          if (sourceType === "worksheet") {
            fetch(`/api/worksheets/${sourceId}`).then(r => r.json()).then(d => setSourceTitle(d.title || "Worksheet")).catch(() => {})
          } else {
            fetch(`/api/syllabus/documents/${sourceId}`).then(r => r.json()).then(d => setSourceTitle(d.file_name || d.topic || "Syllabus")).catch(() => {})
          }
        }
      })
      .catch(() => toast.error("Failed to load student work"))
      .finally(() => setLoading(false))
  }, [sourceId, studentId])

  function updateField(workId: string, field: string, val: any) {
    setItems(prev => prev.map(w => w.id === workId ? { ...w, [field]: val } : w))
  }

  async function saveGrade() {
    setSaving("all")
    let success = 0
    for (const w of items) {
      try {
        const body: Record<string, unknown> = {}
        if (w._score !== undefined) body.score = parseFloat(w._score)
        else if (w.score !== null) body.score = w.score
        if (w._feedback !== undefined) body.feedback = w._feedback
        else if (w.feedback) body.feedback = w.feedback
        if (w._score_category) body.score_category = w._score_category
        else if (w.score_category) body.score_category = w.score_category
        const res = await fetch(`/api/teacher/grading/${w.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Graded ${success}/${items.length}`)
    setSaving(null)
    const allGraded = items.every((i: any) => i.status === "graded" || i.status === "returned")
    if (allGraded) {
      const total = items.reduce((sum, i) => sum + (parseFloat(i._score ?? i.score) || 0), 0)
      setTotalManualScore(total.toFixed(1))
    }
  }

  async function autoGrade() {
    setSaving("all")
    let success = 0
    for (const w of items) {
      try {
        const body: Record<string, unknown> = {}
        const cat = w._score_category ?? w.score_category
        if (cat) body.score_category = cat
        const res = await fetch(`/api/teacher/grading/${w.id}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Auto-graded ${success}/${items.length}`)
    setSaving(null)
    fetch(`/api/teacher/grading?grade=all&status=all`)
      .then(r => r.json())
      .then((data: any[]) => {
        const filtered = data.filter((s: any) =>
          (s.worksheet_id === sourceId || s.syllabus_id === sourceId) &&
          s.student_id === studentId
        )
        setItems(filtered)
      })
      .catch(() => {})
  }

  async function bulkPublish(action: "publish" | "unpublish") {
    const ids = items.filter(i => i.status === "graded" || action === "unpublish").map(i => i.id)
    if (ids.length === 0) { toast.error("No items to publish"); return }
    try {
      const res = await fetch("/api/teacher/grading/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_ids: ids, action }),
      })
      if (res.ok) {
        toast.success(action === "publish" ? "Published!" : "Unpublished!")
        fetch(`/api/teacher/grading?grade=all&status=all`)
          .then(r => r.json())
          .then((data: any[]) => {
            const filtered = data.filter((s: any) =>
              (s.worksheet_id === sourceId || s.syllabus_id === sourceId) &&
              s.student_id === studentId
            )
            setItems(filtered)
          }).catch(() => {})
      } else { const e = await res.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
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
      const saved = localStorage.getItem(`grading_anno_${itemId}`)
      if (saved) {
        const annImg = new Image()
        annImg.onload = () => ctx.drawImage(annImg, 0, 0, 800, 500)
        annImg.src = saved
      }
    }
    img.src = canvasImg
  }

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = e.currentTarget as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top
    return { x: (x / rect.width) * canvas.width, y: (y / rect.height) * canvas.height }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent, itemId: string) {
    e.preventDefault()
    setDrawing(true)
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = toolMode === "eraser" ? "#ffffff" : penColor
    ctx.lineWidth = toolMode === "eraser" ? penSize * 4 : penSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    const pos = getPos(e)
    ctx.moveTo(pos.x, pos.y)
  }

  function doDraw(e: React.MouseEvent | React.TouchEvent, itemId: string) {
    if (!drawing) return
    e.preventDefault()
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDraw(_e: React.MouseEvent | React.TouchEvent, itemId: string) {
    if (!drawing) return
    setDrawing(false)
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    localStorage.setItem(`grading_anno_${itemId}`, canvas.toDataURL())
  }

  function clearAnno(itemId: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    const work = items.find(w => w.id === itemId)
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      localStorage.removeItem(`grading_anno_${itemId}`)
    }
    img.src = work?.canvas_data || ""
  }

  const currentTotal = items.reduce((s: number, i: any) => {
    const v = parseFloat(i._score ?? i.score)
    return s + (isNaN(v) ? 0 : v)
  }, 0)
  const totalMax = items.reduce((s: number, i: any) => s + (i.max_score || 10), 0)
  const allGraded = items.every((i: any) => i.status === "graded" || i.status === "returned")
  const allReturned = items.every((i: any) => i.status === "returned")

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
              {studentName?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <h2 className="font-bold text-sm">{studentName} <span className="text-muted-foreground font-normal text-xs">G{studentGrade || "—"}</span></h2>
              <p className="text-[11px] text-muted-foreground">{sourceTitle || "Assignment"} · {items.length} page(s)</p>
            </div>
          </div>
        </div>

        {/* Score Bar + Actions */}
        <div className="px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5 border">
            <span className="font-medium text-muted-foreground">Total</span>
            <Input type="number" min={0} max={totalMax} step={0.5} value={totalManualScore}
              onChange={e => setTotalManualScore(e.target.value)}
              className="w-16 h-7 text-sm font-bold text-center" />
            <span className="text-muted-foreground">/ {totalMax.toFixed(0)}</span>
            <span className="ml-1 text-muted-foreground">(<strong>{currentTotal.toFixed(1)}</strong>)</span>
          </div>
          <select value={category} onChange={e => {
            setCategory(e.target.value)
            items.forEach(i => updateField(i.id, "_score_category", e.target.value))
          }} className="h-7 text-[11px] rounded-md border border-input bg-background px-1.5">
            <option value="">Category...</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[11px]" onClick={saveGrade} disabled={saving === "all"}>
            <Save className="mr-1 h-3 w-3" />{saving === "all" ? "..." : "Grade"}
          </Button>
          <Button size="sm" variant="secondary" className="h-7 text-[11px]" onClick={autoGrade} disabled={saving === "all"}>
            <Sparkles className="mr-1 h-3 w-3" />Auto
          </Button>
          {allGraded && (allReturned
            ? <Button size="sm" variant="outline" className="h-7 text-[11px] text-amber-600" onClick={() => bulkPublish("unpublish")}><RotateCcw className="mr-1 h-3 w-3" />Unpub</Button>
            : <Button size="sm" className="h-7 text-[11px] bg-green-600 hover:bg-green-700" onClick={() => bulkPublish("publish")} disabled={!category}><Send className="mr-1 h-3 w-3" />Pub</Button>
          )}
        </div>

        {/* Annotation Tools Bar */}
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

      {/* Student Work — Full-width layout like public page */}
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-10">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No submitted work found.</div>
        ) : items.map((item: any, idx: number) => {
          const isCanvas = item.question_type === "canvas"
          const isActive = activeItem === item.id
          const scoreVal = item._score !== undefined ? item._score : (item.score ?? "")
          const fbVal = item._feedback !== undefined ? item._feedback : (item.feedback ?? "")
          return (
            <div key={item.id} className="space-y-3"
              onClick={() => { setActiveItem(item.id); if (isCanvas) setTimeout(() => initAnnoCanvas(item.id, item.canvas_data as string), 50) }}>

              {/* Page header */}
              <div className="flex items-center gap-3 border-b pb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{isCanvas ? "Drawing" : "Written Answer"}</p>
                  {item.question_text && <p className="text-[11px] text-muted-foreground">{item.question_text}</p>}
                </div>
                <Badge variant="outline" className="text-[9px]">{item.status}</Badge>
              </div>

              {/* Answer display */}
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
          <span className="font-semibold">{studentName}</span>
          <span>·</span>
          <span>{sourceTitle || "Assignment"}</span>
          <span>·</span>
          <span>{currentTotal.toFixed(1)}/{totalMax.toFixed(0)}</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={saveGrade} disabled={saving === "all"}>
            <Save className="mr-1 h-4 w-4" />{saving === "all" ? "..." : "Grade All"}
          </Button>
          <Button size="sm" variant="secondary" onClick={autoGrade} disabled={saving === "all"}>
            <Sparkles className="mr-1 h-4 w-4" />Auto
          </Button>
          {allGraded && (allReturned
            ? <Button size="sm" variant="outline" className="text-amber-600" onClick={() => bulkPublish("unpublish")}><RotateCcw className="mr-1 h-4 w-4" />Unpublish</Button>
            : <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => bulkPublish("publish")} disabled={!category}><Send className="mr-1 h-4 w-4" />Publish</Button>
          )}
        </div>
      </div>
    </div>
  )
}
