"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, CheckCircle, Clock, Eye, EyeOff, Trash2, ArrowLeft, FileText, ExternalLink, BookOpen } from "lucide-react"
import Link from "next/link"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import toast from "react-hot-toast"

function getCanvasPos(canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent) {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  let clientX: number, clientY: number
  if ("touches" in e) {
    clientX = e.touches[0]?.clientX ?? 0
    clientY = e.touches[0]?.clientY ?? 0
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
}

function CanvasDraw({ data, onChange, readonly }: { data: string; onChange: (d: string) => void; readonly?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    if (data?.startsWith("data:image")) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      img.src = data
    }
  }, [data])

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    if (readonly) return; e.preventDefault(); setDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getCanvasPos(canvas, e.nativeEvent as MouseEvent | TouchEvent)
    lastPos.current = pos
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y)
  }
  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing || readonly) return; e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return; const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getCanvasPos(canvas, e.nativeEvent as MouseEvent | TouchEvent)
    if (lastPos.current) {
      ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    }
    lastPos.current = pos
  }
  function stopDrawing() {
    if (!drawing) return; setDrawing(false); lastPos.current = null
    if (canvasRef.current) onChange(canvasRef.current.toDataURL())
  }
  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return; const ctx = canvas.getContext("2d")
    if (!ctx) return; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); onChange("")
  }

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} width={800} height={500}
        className="rounded-xl border-2 border-border w-full cursor-crosshair touch-none"
        style={{ maxWidth: 800, aspectRatio: "800/500" }}
        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
      {!readonly && (
        <Button variant="outline" size="sm" onClick={clearCanvas}><Trash2 className="mr-1 h-3 w-3" />Clear Drawing</Button>
      )}
    </div>
  )
}

interface Answer {
  id?: string; question_id: string; question_text: string; question_type: "paragraph" | "canvas"
  answer_text: string | null; canvas_data: unknown; score: number | null; max_score: number
  feedback: string | null; status: string
}

const QUESTIONS = [
  { id: "q1", text: "Explain the main concept you learned this week in your own words.", type: "paragraph" as const },
  { id: "q2", text: "Draw a diagram showing the relationship between the key variables.", type: "canvas" as const },
  { id: "q3", text: "Describe one real-world application of this week's topic.", type: "paragraph" as const },
]

interface PublishedItem {
  id: string
  title?: string
  grade: number
  week_number?: number
  topic?: string
  file_name?: string
  created_at: string
}

interface SubmissionInfo {
  status: string
  allReturned: boolean
  allGraded: boolean
}

export default function MyWorkPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const grade = profile?.grade_assigned ?? 0
  const week = getCurrentWeek()
  const { data: packages } = usePackages({ grade, status: "published" })
  const pkg = packages?.[0]

  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState(false)
  const [existingIds, setExistingIds] = useState<Record<string, string>>({})
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [allGraded, setAllGraded] = useState(false)

  const [publishedWorksheets, setPublishedWorksheets] = useState<PublishedItem[]>([])
  const [publishedSyllabi, setPublishedSyllabi] = useState<PublishedItem[]>([])
  const [wsSubmissions, setWsSubmissions] = useState<Record<string, SubmissionInfo>>({})
  const [sySubmissions, setSySubmissions] = useState<Record<string, SubmissionInfo>>({})

  const [activeTab, setActiveTab] = useState<"weekly" | "worksheets" | "syllabi">("weekly")

  useEffect(() => {
    if (!grade) return
    fetch(`/api/published-items?grade=${grade}`)
      .then(r => r.json())
      .then(d => {
        const wss = d.worksheets || []
        const sys = d.syllabi || []
        setPublishedWorksheets(wss)
        setPublishedSyllabi(sys)
        wss.forEach((ws: PublishedItem) => {
          fetch(`/api/student-work?worksheet_id=${ws.id}`)
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                const statuses = data.map((w: any) => w.status)
                setWsSubmissions(prev => ({ ...prev, [ws.id]: { allReturned: statuses.every(s => s === 'returned'), allGraded: statuses.every(s => s === 'graded' || s === 'returned'), status: statuses.includes('returned') ? 'returned' : statuses.includes('graded') ? 'graded' : 'submitted' } }))
              }
            }).catch(() => {})
        })
        sys.forEach((sy: PublishedItem) => {
          fetch(`/api/student-work?syllabus_id=${sy.id}`)
            .then(r => r.json())
            .then(data => {
              if (Array.isArray(data) && data.length > 0) {
                const statuses = data.map((w: any) => w.status)
                setSySubmissions(prev => ({ ...prev, [sy.id]: { allReturned: statuses.every(s => s === 'returned'), allGraded: statuses.every(s => s === 'graded' || s === 'returned'), status: statuses.includes('returned') ? 'returned' : statuses.includes('graded') ? 'graded' : 'submitted' } }))
              }
            }).catch(() => {})
        })
      }).catch(() => {})
  }, [grade])

  useEffect(() => {
    if (!profile?.id || !pkg?.id) return
    fetch(`/api/student-work?package_id=${pkg.id}`)
      .then((r) => r.json())
      .then((data: Answer[]) => {
        if (data.length === 0) return
        const map: Record<string, Answer> = {}
        const idMap: Record<string, string> = {}
        data.forEach((a) => { map[a.question_id] = a; if (a.id) idMap[a.question_id] = a.id })
        setAnswers(map)
        setExistingIds(idMap)
        if (data.length >= QUESTIONS.length) setSubmitted(true)
        if (data.every((a) => a.status === "graded")) setAllGraded(true)
      })
      .catch(() => {})
  }, [profile, pkg])

  function updateAnswer(qId: string, field: string, value: string | unknown) {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], question_id: qId, question_text: QUESTIONS.find((q) => q.id === qId)?.text ?? "", question_type: QUESTIONS.find((q) => q.id === qId)?.type ?? "paragraph", [field]: value } }))
  }

  async function handleSubmitAll() {
    const empty = QUESTIONS.filter((q) => { const ans = answers[q.id]; return !ans || (!ans.answer_text && !ans.canvas_data) })
    if (empty.length > 0) { toast.error("Please answer all questions first."); return }
    setSaving(true)
    let success = 0
    for (const q of QUESTIONS) {
      const ans = answers[q.id]
      const payload = { package_id: pkg?.id, question_id: q.id, question_text: q.text, question_type: q.type, answer_text: ans.answer_text ?? null, canvas_data: ans.canvas_data ?? null, max_score: 10 }
      try {
        const existingId = existingIds[q.id]
        const res = existingId ? await fetch(`/api/student-work/${existingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }) : await fetch("/api/student-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        if (res.ok) { const data = await res.json(); setExistingIds((prev) => ({ ...prev, [q.id]: data.id })); success++ }
      } catch {}
    }
    setSaving(false)
    if (success === QUESTIONS.length) { setSubmitted(true); toast.success("All answers submitted!"); setTimeout(() => router.push("/my-week"), 2000) }
    else toast.error(`${success}/${QUESTIONS.length} submitted.`)
  }

  const hasWeeklyWork = !!pkg
  const hasWorksheets = publishedWorksheets.length > 0
  const hasSyllabi = publishedSyllabi.length > 0

  const totalAssignments = (hasWeeklyWork ? 1 : 0) + publishedWorksheets.length + publishedSyllabi.length

  function SubmissionBadge({ sub }: { sub?: SubmissionInfo }) {
    if (!sub) return null
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${sub.allReturned ? 'bg-green-100 text-green-700' : sub.allGraded ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
        {sub.status}
      </span>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
        <p className="text-sm text-muted-foreground">
          {totalAssignments > 0 ? `${totalAssignments} assignment${totalAssignments > 1 ? "s" : ""} available` : "No assignments yet"}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
        {hasWeeklyWork && (
          <button onClick={() => setActiveTab("weekly")} className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${activeTab === "weekly" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}>
            📖 Weekly Work
          </button>
        )}
        {hasSyllabi && (
          <button onClick={() => setActiveTab("syllabi")} className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${activeTab === "syllabi" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}>
            📋 Syllabus ({publishedSyllabi.length})
          </button>
        )}
        {hasWorksheets && (
          <button onClick={() => setActiveTab("worksheets")} className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${activeTab === "worksheets" ? "bg-background shadow-sm" : "hover:bg-background/50"}`}>
            📝 Worksheets ({publishedWorksheets.length})
          </button>
        )}
      </div>

      {/* Weekly Work Tab */}
      {activeTab === "weekly" && hasWeeklyWork && (
        <>
          {submitted && allGraded ? (
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardContent className="py-8 text-center space-y-3">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold">All Questions Graded!</h2>
                <p className="text-3xl font-bold text-green-600">{QUESTIONS.reduce((s, q) => s + (answers[q.id]?.score ?? 0), 0)}/{QUESTIONS.length * 10}</p>
                <p className="text-sm text-muted-foreground">Your teacher has reviewed your answers.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{pkg.topic} — Grade {grade}, Week {week}</p>
                </div>
                {submitted && <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Awaiting Review</Badge>}
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Answer all questions below</CardTitle></CardHeader>
                <CardContent className="space-y-8">
                  {QUESTIONS.map((q, idx) => {
                    const ans = answers[q.id]
                    return (
                      <div key={q.id}>
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{idx + 1}</div>
                          <p className="font-medium text-sm flex-1">{q.text}</p>
                        </div>
                        {q.type === "paragraph" ? (
                          <textarea value={ans?.answer_text ?? ""} onChange={(e) => updateAnswer(q.id, "answer_text", e.target.value)} onPaste={(e) => { e.preventDefault(); toast.error("Copy-paste disabled.") }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} rows={5} className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-y" placeholder="Type your answer here..." disabled={submitted} />
                        ) : (
                          <CanvasDraw data={ans?.canvas_data as string ?? ""} onChange={(d) => updateAnswer(q.id, "canvas_data", d)} readonly={submitted} />
                        )}
                        {ans?.status === "graded" && (
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="font-medium">Score: {ans.score ?? "?"}/{ans.max_score ?? 10}</span>
                          </div>
                        )}
                        {idx < QUESTIONS.length - 1 && <Separator className="mt-6" />}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
              {!submitted && (
                <div className="flex justify-center">
                  <Button size="lg" onClick={handleSubmitAll} disabled={saving} className="gap-2 px-8">
                    <Send className="h-5 w-5" />{saving ? "Submitting..." : "Submit All Answers"}
                  </Button>
                </div>
              )}
              {submitted && !allGraded && (
                <Card className="border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                  <CardContent className="py-6 text-center">
                    <Clock className="h-8 w-8 text-amber-500 mx-auto" />
                    <h3 className="font-semibold">Answers Submitted</h3>
                    <p className="text-sm text-muted-foreground">Your teacher will review them.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Syllabus Assignments Tab */}
      {activeTab === "syllabi" && hasSyllabi && (
        <div className="space-y-3">
          {publishedSyllabi.map((sy) => {
            const sub = sySubmissions[sy.id]
            return (
              <Link key={sy.id} href={`/syllabus/public/${sy.id}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{sy.file_name || "Syllabus Document"}</p>
                    <p className="text-xs text-muted-foreground">Grade {sy.grade} · {sy.topic || "Syllabus"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SubmissionBadge sub={sub} />
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Worksheet Assignments Tab */}
      {activeTab === "worksheets" && hasWorksheets && (
        <div className="space-y-3">
          {publishedWorksheets.map((ws) => {
            const sub = wsSubmissions[ws.id]
            return (
              <Link key={ws.id} href={`/worksheet/public/${ws.id}`}
                className="flex items-center justify-between rounded-xl border bg-card p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{ws.title}</p>
                    <p className="text-xs text-muted-foreground">Grade {ws.grade}{ws.week_number ? ` · Week ${ws.week_number}` : ""}{ws.topic ? ` · ${ws.topic}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SubmissionBadge sub={sub} />
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {totalAssignments === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No assignments available yet. Check back later.</CardContent></Card>
      )}
    </div>
  )
}
