"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Send, Palette, Type, CheckCircle, XCircle, Clock, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

interface Answer {
  id?: string
  question_id: string
  question_text: string
  question_type: "paragraph" | "canvas" | "multiple_choice"
  answer_text: string | null
  canvas_data: unknown
  score: number | null
  max_score: number
  feedback: string | null
  status: string
}

function CanvasDraw({ data, onChange, readonly }: { data: string; onChange: (d: string) => void; readonly?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"

    if (data) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = data
    }
  }, [data])

  function startDraw() { if (!readonly) setDrawing(true) }
  function stopDraw() { if (!readonly) { setDrawing(false); saveCanvas() } }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing || readonly) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  function saveCanvas() {
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL())
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    onChange("")
  }

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="rounded-lg border w-full cursor-crosshair"
        style={{ maxWidth: 400 }}
        onMouseDown={startDraw}
        onMouseUp={stopDraw}
        onMouseMove={draw}
        onMouseLeave={stopDraw}
      />
      {!readonly && (
        <Button variant="outline" size="sm" onClick={clearCanvas}>Clear</Button>
      )}
    </div>
  )
}

const QUESTIONS = [
  { id: "q1", text: "Explain the main concept you learned this week in your own words.", type: "paragraph" as const },
  { id: "q2", text: "Draw a diagram showing the relationship between the key variables.", type: "canvas" as const },
  { id: "q3", text: "Describe one real-world application of this week's topic.", type: "paragraph" as const },
]

export default function MyWorkPage() {
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const week = 1
  const { data: packages } = usePackages({ grade, status: "published" })
  const pkg = packages?.[0]

  const [activeTab, setActiveTab] = useState(QUESTIONS[0]?.id ?? "q1")
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})
  const [existingIds, setExistingIds] = useState<Record<string, string>>({})
  const [showGrade, setShowGrade] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    fetch(`/api/student-work?package_id=${pkg?.id ?? ""}`)
      .then((r) => r.json())
      .then((data: Answer[]) => {
        const map: Record<string, Answer> = {}
        const idMap: Record<string, string> = {}
        const subMap: Record<string, boolean> = {}
        data.forEach((a) => {
          map[a.question_id] = a
          if (a.id) idMap[a.question_id] = a.id
          if (a.status === "submitted" || a.status === "graded") subMap[a.question_id] = true
        })
        setAnswers(map)
        setExistingIds(idMap)
        setSubmitted(subMap)
      })
      .catch(() => {})
  }, [profile, pkg])

  function updateAnswer(qId: string, field: string, value: string | unknown) {
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], question_id: qId, question_text: QUESTIONS.find((q) => q.id === qId)?.text ?? "", question_type: QUESTIONS.find((q) => q.id === qId)?.type ?? "paragraph", [field]: value },
    }))
  }

  async function handleSubmit(qId: string) {
    const ans = answers[qId]
    if (!ans || (!ans.answer_text && !ans.canvas_data)) {
      toast.error("Please provide an answer before submitting.")
      return
    }

    setSaving(qId)
    try {
      const existingId = existingIds[qId]
      const payload = {
        package_id: pkg?.id,
        question_id: qId,
        question_text: QUESTIONS.find((q) => q.id === qId)?.text ?? "",
        question_type: QUESTIONS.find((q) => q.id === qId)?.type ?? "paragraph",
        answer_text: ans.answer_text ?? null,
        canvas_data: ans.canvas_data ?? null,
        max_score: 10,
        status: "submitted",
      }

      let res: Response
      if (existingId && submitted[qId]) {
        res = await fetch(`/api/student-work/${existingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch("/api/student-work", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        const data = await res.json()
        setSubmitted((prev) => ({ ...prev, [qId]: true }))
        setExistingIds((prev) => ({ ...prev, [qId]: data.id }))
        toast.success("Answer submitted!")
      } else {
        toast.error("Failed to submit.")
      }
    } catch {
      toast.error("Failed to submit.")
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Work</h1>
        <p className="text-sm text-muted-foreground">
          {pkg ? `Grade ${grade} — Week ${week}: ${pkg.topic}` : "No published package yet."}
        </p>
      </div>

      {pkg && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            {QUESTIONS.map((q) => (
              <TabsTrigger key={q.id} value={q.id} className="flex-1 relative">
                {q.type === "canvas" ? <Palette className="mr-1 h-3 w-3" /> : <Type className="mr-1 h-3 w-3" />}
                Q{QUESTIONS.indexOf(q) + 1}
                {submitted[q.id] && <CheckCircle className="ml-1 h-3 w-3 text-green-500" />}
              </TabsTrigger>
            ))}
          </TabsList>

          {QUESTIONS.map((q, idx) => {
            const ans = answers[q.id]
            const isSub = submitted[q.id]
            const isGraded = ans?.status === "graded"

            return (
              <TabsContent key={q.id} value={q.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">{idx + 1}</span>
                      {q.text}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {q.type === "paragraph" ? (
                      <textarea
                        value={ans?.answer_text ?? ""}
                        onChange={(e) => updateAnswer(q.id, "answer_text", e.target.value)}
                        onPaste={(e) => {
                          e.preventDefault()
                          toast.error("Copy-paste is disabled. Please type your answer manually.")
                        }}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        rows={6}
                        className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-y"
                        placeholder="Type your answer here... (paste disabled)"
                        disabled={isSub && !isGraded}
                      />
                    ) : (
                      <CanvasDraw
                        data={ans?.canvas_data as string ?? ""}
                        onChange={(d) => updateAnswer(q.id, "canvas_data", d)}
                        readonly={isSub && !isGraded}
                      />
                    )}

                    {!isSub && (
                      <Button onClick={() => handleSubmit(q.id)} disabled={saving === q.id}>
                        <Send className="mr-1 h-4 w-4" />
                        {saving === q.id ? "Saving..." : "Submit Answer"}
                      </Button>
                    )}

                    {isSub && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          Submitted
                        </Badge>
                        {!isGraded && (
                          <Button variant="outline" size="sm" onClick={() => handleSubmit(q.id)} disabled={saving === q.id}>
                            Resubmit
                          </Button>
                        )}
                      </div>
                    )}

                    {isGraded && (
                      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">Score</span>
                          <span className="text-lg font-bold text-green-700 dark:text-green-400">
                            {ans?.score ?? "?"} / {ans?.max_score ?? 10}
                          </span>
                        </div>
                        {ans?.feedback && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setShowGrade((p) => ({ ...p, [q.id]: !p[q.id] }))}>
                              {showGrade[q.id] ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                              {showGrade[q.id] ? "Hide" : "Show"} Feedback
                            </Button>
                            {showGrade[q.id] && (
                              <div className="rounded-lg bg-white p-3 text-sm dark:bg-green-950/50">
                                <p className="font-medium text-xs text-muted-foreground mb-1">Teacher Feedback:</p>
                                <p>{ans.feedback}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      )}

      {!pkg && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No published package available for your grade yet. Check back after your teacher publishes one.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
