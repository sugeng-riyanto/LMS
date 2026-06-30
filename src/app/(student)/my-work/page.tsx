"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Send, CheckCircle, Clock, Eye, EyeOff, Trash2, ArrowLeft } from "lucide-react"
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

export default function MyWorkPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const week = getCurrentWeek()
  const { data: packages } = usePackages({ grade, status: "published" })
  const pkg = packages?.[0]

  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState(false)
  const [existingIds, setExistingIds] = useState<Record<string, string>>({})
  const [showFeedback, setShowFeedback] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [allGraded, setAllGraded] = useState(false)

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
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        question_id: qId,
        question_text: QUESTIONS.find((q) => q.id === qId)?.text ?? "",
        question_type: QUESTIONS.find((q) => q.id === qId)?.type ?? "paragraph",
        [field]: value,
      },
    }))
  }

  async function handleSubmitAll() {
    const empty = QUESTIONS.filter((q) => {
      const ans = answers[q.id]
      return !ans || (!ans.answer_text && !ans.canvas_data)
    })
    if (empty.length > 0) {
      toast.error(`Please answer all questions first.`)
      return
    }

    setSaving(true)
    let success = 0

    for (const q of QUESTIONS) {
      const ans = answers[q.id]
      const payload = {
        package_id: pkg?.id,
        question_id: q.id,
        question_text: q.text,
        question_type: q.type,
        answer_text: ans.answer_text ?? null,
        canvas_data: ans.canvas_data ?? null,
        max_score: 10,
      }

      try {
        const existingId = existingIds[q.id]
        const res = existingId
          ? await fetch(`/api/student-work/${existingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
          : await fetch("/api/student-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })

        if (res.ok) {
          const data = await res.json()
          setExistingIds((prev) => ({ ...prev, [q.id]: data.id }))
          success++
        }
      } catch {}
    }

    setSaving(false)

    if (success === QUESTIONS.length) {
      setSubmitted(true)
      toast.success("All answers submitted! Your teacher will review and provide feedback.")
      setTimeout(() => router.push("/my-week"), 2000)
    } else {
      toast.error(`${success}/${QUESTIONS.length} submitted. Please try again.`)
    }
  }

  if (!pkg) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/my-week")}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
        </div>
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No published package available yet.</CardContent></Card>
      </div>
    )
  }

  if (submitted && allGraded) {
    const totalScore = QUESTIONS.reduce((s, q) => s + (answers[q.id]?.score ?? 0), 0)
    const maxScore = QUESTIONS.length * 10
    return (
      <div className="space-y-6 max-w-3xl">
        <Card className="border-2 border-green-200 dark:border-green-800">
          <CardContent className="py-8 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold">All Questions Graded!</h2>
            <p className="text-3xl font-bold text-green-600">{totalScore}/{maxScore}</p>
            <p className="text-sm text-muted-foreground">Your teacher has reviewed your answers.</p>
            <div className="space-y-3 mt-4 text-left max-w-md mx-auto">
              {QUESTIONS.map((q, i) => {
                const ans = answers[q.id]
                return (
                  <div key={q.id} className="rounded-lg border p-3 text-sm">
                    <p className="font-medium mb-1">Q{i + 1}: {q.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Score: <strong>{ans?.score ?? "?"}/{ans?.max_score ?? 10}</strong></span>
                      {ans?.feedback && (
                        <Button variant="ghost" size="sm" onClick={() => setShowFeedback((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                          {showFeedback[q.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Feedback
                        </Button>
                      )}
                    </div>
                    {showFeedback[q.id] && ans?.feedback && (
                      <p className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded">{ans.feedback}</p>
                    )}
                  </div>
                )
              })}
            </div>
            <Button variant="outline" onClick={() => router.push("/my-week")}>Back to My Week</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/my-week")}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-2">Weekly Work</h1>
          <p className="text-sm text-muted-foreground">
            {pkg.topic} — Grade {grade}, Week {week}
          </p>
        </div>
        {submitted && <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Awaiting Review</Badge>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Answer all questions below</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {QUESTIONS.map((q, idx) => {
            const ans = answers[q.id]
            const isGraded = ans?.status === "graded"
            return (
              <div key={q.id}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{idx + 1}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{q.text}</p>
                    {isGraded && <Badge className="mt-1 bg-green-100 text-green-700 text-xs"><CheckCircle className="mr-1 h-3 w-3" />Graded</Badge>}
                  </div>
                </div>

                {q.type === "paragraph" ? (
                  <textarea
                    value={ans?.answer_text ?? ""}
                    onChange={(e) => updateAnswer(q.id, "answer_text", e.target.value)}
                    onPaste={(e) => { e.preventDefault(); toast.error("Copy-paste disabled. Type manually.") }}
                    onCopy={(e) => e.preventDefault()}
                    onCut={(e) => e.preventDefault()}
                    rows={5}
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-y"
                    placeholder="Type your answer here... (paste disabled)"
                    disabled={submitted}
                  />
                ) : (
                  <CanvasDraw data={ans?.canvas_data as string ?? ""} onChange={(d) => updateAnswer(q.id, "canvas_data", d)} readonly={submitted} />
                )}

                {isGraded && (
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="font-medium">Score: {ans?.score ?? "?"}/{ans?.max_score ?? 10}</span>
                    {ans?.feedback && (
                      <Button variant="ghost" size="sm" onClick={() => setShowFeedback((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                        {showFeedback[q.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />} Feedback
                      </Button>
                    )}
                  </div>
                )}
                {showFeedback[q.id] && ans?.feedback && (
                  <div className="mt-1 rounded-lg bg-muted p-3 text-sm"><p className="font-medium text-xs text-muted-foreground mb-1">Teacher Feedback:</p><p>{ans.feedback}</p></div>
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
            <Send className="h-5 w-5" />
            {saving ? "Submitting..." : "Submit All Answers"}
          </Button>
        </div>
      )}

      {submitted && !allGraded && (
        <Card className="border-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="py-6 text-center space-y-2">
            <Clock className="h-8 w-8 text-amber-500 mx-auto" />
            <h3 className="font-semibold">Answers Submitted</h3>
            <p className="text-sm text-muted-foreground">Your answers have been submitted. Your teacher will review them and provide scores and feedback. You will be notified when grading is complete.</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/my-week")}>Back to My Week</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
