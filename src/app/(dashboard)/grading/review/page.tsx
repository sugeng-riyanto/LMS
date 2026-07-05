"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save, Sparkles, Send, RotateCcw, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { PDFPageBackground } from "@/components/pdf-page-background"

const CATEGORIES = [
  { value: "classwork", label: "Classwork", weight: "40%" },
  { value: "unit_test", label: "Unit Test", weight: "20%" },
  { value: "project", label: "Project", weight: "10%" },
  { value: "homework", label: "Homework", weight: "10%" },
  { value: "mid_semester", label: "Mid Semester", weight: "10%" },
  { value: "final_semester", label: "Final Semester", weight: "10%" },
]

export default function GradingReviewPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ReviewContent />
    </Suspense>
  )
}

function ReviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sourceType = searchParams.get("sourceType") || ""
  const sourceId = searchParams.get("sourceId") || ""
  const studentId = searchParams.get("studentId") || ""
  const studentName = searchParams.get("studentName") || "Student"
  const studentGrade = searchParams.get("studentGrade") || ""

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
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
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const annoRendered = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!sourceId || !studentId) return
    setLoading(true)
    setFetchError("")
    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), 15000)
    fetch(`/api/teacher/grading?student_id=${studentId}&status=all`, { signal: ac.signal })
      .then(async r => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: r.statusText }))
          throw new Error(err.error || "API error")
        }
        return r.json()
      })
      .then((data: any[]) => {
        const all = Array.isArray(data) ? data : []
        const filtered = all.filter((s: any) =>
          s.worksheet_id === sourceId || s.syllabus_id === sourceId || s.package_id === sourceId || s.id === sourceId
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
            const ac2 = new AbortController()
            setTimeout(() => ac2.abort(), 10000)
            fetch(`/api/worksheets/${sourceId}`, { signal: ac2.signal }).then(r => r.json()).then(d => {
              setSourceTitle(d.title || "Worksheet")
              if (Array.isArray(d.page_images)) setPageImages(d.page_images)
              if (d.pdf_url) setPdfUrl(d.pdf_url)
            }).catch(() => {})
          } else {
            setSourceTitle(sourceType === "syllabus" ? "Syllabus Assignment" : "Assignment")
          }
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          setFetchError("Request timed out — please try again")
        } else {
          setFetchError(err.message)
        }
        toast.error("Failed to load student work")
      })
      .finally(() => { clearTimeout(timer); setLoading(false) })
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
        const annoData = localStorage.getItem(`grading_anno_${w.id}`)
        if (annoData) body.teacher_annotation = annoData
        const res = await fetch(`/api/teacher/grading/${w.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Graded ${success}/${items.length}`)
    setSaving(null)
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
    fetch(`/api/teacher/grading?student_id=${studentId}&status=all`)
      .then(r => r.json())
      .then((data: any[]) => {
        const all = Array.isArray(data) ? data : []
        setItems(all.filter((s: any) => s.worksheet_id === sourceId || s.syllabus_id === sourceId))
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
        fetch(`/api/teacher/grading?student_id=${studentId}&status=all`)
          .then(r => r.json())
          .then((data: any[]) => {
            const all = Array.isArray(data) ? data : []
            setItems(all.filter((s: any) => s.worksheet_id === sourceId || s.syllabus_id === sourceId))
          }).catch(() => {})
      } else { const e = await res.json(); toast.error(e.error || "Failed") }
    } catch { toast.error("Failed") }
  }

  function loadAnnoOverlay(itemId: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    if (annoRendered.current.has(itemId)) return
    annoRendered.current.add(itemId)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const w = canvas.clientWidth || 800
    const h = canvas.clientHeight || 600
    canvas.width = w; canvas.height = h
    const localSaved = localStorage.getItem(`grading_anno_${itemId}`)
    const serverAnno = items.find((w: any) => w.id === itemId)?.teacher_annotation
    const src = localSaved || serverAnno
    if (src) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, w, h)
      img.src = src
    }
  }

  useEffect(() => {
    annoRendered.current.clear()
    if (!items.length) return
    items.forEach((item: any) => {
      if (item.canvas_data) {
        setTimeout(() => loadAnnoOverlay(item.id), 100)
      }
    })
  }, [items])

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = e.currentTarget as HTMLCanvasElement
    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? (e.touches[0]?.clientX ?? 0) - rect.left : e.clientX - rect.left
    const y = "touches" in e ? (e.touches[0]?.clientY ?? 0) - rect.top : e.clientY - rect.top
    return { x: (x / rect.width) * canvas.width, y: (y / rect.height) * canvas.height }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent, itemId: string) {
    e.preventDefault()
    setActiveItem(itemId)
    setDrawing(true)
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (toolMode === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = penSize * 4
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = penColor
      ctx.lineWidth = penSize
    }
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    const pos = getPos(e)
    ctx.moveTo(pos.x, pos.y)
  }

  function doDraw(e: React.MouseEvent | React.TouchEvent, itemId: string) {
    if (!drawing || activeItem !== itemId) return
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
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.globalCompositeOperation = "source-over"
    localStorage.setItem(`grading_anno_${itemId}`, canvas.toDataURL())
  }

  function clearAnno(itemId: string) {
    const canvas = canvasRefs.current[itemId]
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    localStorage.removeItem(`grading_anno_${itemId}`)
  }

  async function saveAnnotationsOnly() {
    setSaving("anno")
    let success = 0
    for (const w of items) {
      try {
        const annoData = localStorage.getItem(`grading_anno_${w.id}`)
        if (!annoData) { success++; continue }
        const res = await fetch(`/api/teacher/grading/${w.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacher_annotation: annoData }),
        })
        if (res.ok) success++
      } catch {}
    }
    toast.success(`Annotations saved for ${success}/${items.length}`)
    setSaving(null)
  }

  useEffect(() => {
    const beforePrint = () => {
      document.querySelectorAll<HTMLElement>('[data-print-group]').forEach(group => {
        const layerImages: HTMLImageElement[] = []
        group.querySelectorAll<HTMLElement>('[data-print-layer]').forEach(el => {
          if (el.tagName === 'CANVAS') {
            const c = el as HTMLCanvasElement
            const img = document.createElement('img')
            try { img.src = c.toDataURL() } catch { return }
            img.dataset.canvasSnapshot = 'true'
            img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;z-index:20'
            el.parentNode?.insertBefore(img, el.nextSibling)
            el.style.display = 'none'
            layerImages.push(img)
          } else if (el.tagName === 'IMG') {
            layerImages.push(el as HTMLImageElement)
          }
        })
        if (!layerImages.length) return
        const canvas = document.createElement('canvas')
        const w = group.offsetWidth
        const h = group.offsetHeight
        if (!w || !h) return
        canvas.width = w * 2
        canvas.height = h * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(2, 2)
        layerImages.forEach(img => {
          try { ctx.drawImage(img, 0, 0, w, h) } catch {}
        })
        const composite = document.createElement('img')
        composite.src = canvas.toDataURL('image/jpeg', 0.92)
        composite.style.cssText = 'display:block;width:100%'
        composite.dataset.printTemp = 'true'
        layerImages.forEach(l => { l.style.display = 'none' })
        group.appendChild(composite)
      })
    }
    const afterPrint = () => {
      document.querySelectorAll<HTMLElement>('[data-print-temp]').forEach(el => el.remove())
      document.querySelectorAll<HTMLElement>('[data-canvas-snapshot]').forEach(el => el.remove())
      document.querySelectorAll<HTMLElement>('[data-print-layer]').forEach(el => { el.style.display = '' })
    }
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [items])

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

  if (fetchError) {
    return <div className="flex h-64 items-center justify-center"><p className="text-sm text-red-500">Error: {fetchError}</p></div>
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
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={saveAnnotationsOnly} disabled={saving === "anno"}>
            {saving === "anno" ? "..." : "Save Anno"}
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px] gap-1" onClick={() => window.print()}>
            <FileDown className="h-3 w-3" /> PDF
          </Button>
            <span className="text-[10px] text-muted-foreground ml-auto">v2 - Click a page below to annotate</span>
        </div>
      </div>

      {/* Student Work */}
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-10">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No submitted work found for this assignment.</div>
        ) : (
          <div className="flex gap-1 text-[9px] text-muted-foreground bg-muted/20 rounded px-2 py-1 mb-2">
            <span>items:{items.length}</span>
            <span>pdfUrl:{pdfUrl ? "yes" : "no"}</span>
            <span>bgImgs:{pageImages.length}</span>
            {pdfUrl && <a href={pdfUrl} target="_blank" className="underline text-blue-500">open PDF</a>}
          </div>
        )}
        {items.map((item: any, idx: number) => {
          const isActive = activeItem === item.id
          const hasCanvas = !!item.canvas_data
          const hasText = !!item.answer_text
          const scoreVal = item._score !== undefined ? item._score : (item.score ?? "")
          const fbVal = item._feedback !== undefined ? item._feedback : (item.feedback || item.answer_text || "")
          const pageIdx = item.question_id ? parseInt(item.question_id.replace("page-", "")) - 1 : -1
          const bgImage = pageImages[pageIdx] || null
          return (
            <div key={item.id} className="space-y-3">

              <div className="flex items-center gap-3 border-b pb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">
                    {hasCanvas ? "Drawing" : ""}{hasCanvas && hasText ? " + " : ""}{hasText ? "Written Answer" : ""}
                    {!hasCanvas && !hasText ? "Page" : ""}
                  </p>
                  {item.question_text && <p className="text-[11px] text-muted-foreground">{item.question_text}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-muted-foreground">{item.canvas_data?.length || 0}b</span>
                  <Badge variant="outline" className="text-[9px]">{item.status}</Badge>
                </div>
              </div>

              <div className={`bg-gray-50 rounded-lg overflow-hidden ${isActive ? "ring-2 ring-green-400" : "border"}`}>
                {hasCanvas && (
                  <div className="relative" data-print-group>
                    {/* PDF background layer (behind student work) */}
                    {bgImage ? (
                      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-contain" style={{ zIndex: 0 }} />
                    ) : pdfUrl ? (
                      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                        <PDFPageBackground pdfUrl={pdfUrl} pageNum={pageIdx + 1} />
                      </div>
                    ) : null}
                    {/* Student work — block element provides natural height */}
                    <img src={item.canvas_data} alt="Student work" className="w-full max-h-[90vh] object-contain relative" style={{ zIndex: 10, opacity: 0.85 }} data-print-layer />
                    {/* Teacher annotation overlay — covers parent exactly */}
                    <canvas ref={el => { canvasRefs.current[item.id] = el }}
                      className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                      style={{ zIndex: 20 }}
                      data-print-layer
                      onMouseDown={e => { setActiveItem(item.id); startDraw(e, item.id) }}
                      onMouseMove={e => doDraw(e, item.id)}
                      onMouseUp={e => stopDraw(e, item.id)}
                      onMouseLeave={e => stopDraw(e, item.id)} />
                  </div>
                )}
                {hasText && (
                  <div className={hasCanvas ? "border-t" : ""}>
                    <pre className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed min-h-[60px]">
                      {item.answer_text}
                    </pre>
                  </div>
                )}
                {!hasCanvas && !hasText && (
                  <div className="flex items-center justify-center h-24 text-xs text-muted-foreground italic">No submission</div>
                )}
              </div>

              <div className="flex flex-wrap items-end gap-3">
          {pdfUrl && idx === 0 && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-md border border-input bg-background h-6 px-2 text-[9px] font-medium hover:bg-accent">PDF</a>
          )}
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
                {isActive && hasCanvas && (
                  <Button size="sm" variant="ghost" className="h-6 text-[9px] text-muted-foreground" onClick={() => clearAnno(item.id)}>
                    Clear Annotations
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

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
