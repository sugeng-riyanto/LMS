"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Video, FlaskConical, PenTool, FileText, CheckCircle, Clock, Send, Trash2, Eye, EyeOff, Download, ExternalLink, ArrowRight } from "lucide-react"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

function getCanvasPos(canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent) {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width / rect.width, sy = canvas.height / rect.height
  let cx: number, cy: number
  if ("touches" in e) { cx = e.touches[0]?.clientX ?? 0; cy = e.touches[0]?.clientY ?? 0 }
  else { cx = e.clientX; cy = e.clientY }
  return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy }
}

function CanvasWidget({ data, onChange, readonly }: { data: string; onChange: (d: string) => void; readonly?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext("2d"); if (!ctx) return
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = "#1a1a2e"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"
    if (data?.startsWith("data:image")) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height); img.src = data }
  }, [data])

  function start(e: React.MouseEvent | React.TouchEvent) { if (readonly) return; e.preventDefault(); setDrawing(true); const c = ref.current; if (!c) return; const p = getCanvasPos(c, e.nativeEvent as any); last.current = p; c.getContext("2d")?.beginPath(); c.getContext("2d")?.moveTo(p.x, p.y) }
  function move(e: React.MouseEvent | React.TouchEvent) { if (!drawing || readonly) return; e.preventDefault(); const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx || !last.current) return; const p = getCanvasPos(c, e.nativeEvent as any); ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p }
  function stop() { if (!drawing) return; setDrawing(false); last.current = null; if (ref.current) onChange(ref.current.toDataURL()) }
  function clear() { const c = ref.current; if (!c) return; c.getContext("2d")?.fillRect(0, 0, c.width, c.height); onChange("") }

  return <div className="space-y-2">
    <canvas ref={ref} width={600} height={350} className="rounded-lg border-2 w-full cursor-crosshair touch-none"
      onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
      onTouchStart={start} onTouchMove={move} onTouchEnd={stop} />
    {!readonly && <Button variant="outline" size="sm" onClick={clear}><Trash2 className="mr-1 h-3 w-3" />Clear</Button>}
  </div>
}

export default function MyWeekPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const thisWeek = getCurrentWeek()
  const { data: packages, isLoading } = usePackages({ grade, status: "published" })
  const pkg = packages?.find((p) => p.week === thisWeek)

  // Inline answer state
  const [answers, setAnswers] = useState<Record<string, { text: string; canvas: string; id?: string; score?: number; feedback?: string; status?: string }>>({})
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [showFb, setShowFb] = useState<Record<string, boolean>>({})
  const [allSubmitted, setAllSubmitted] = useState(false)

  const QUESTIONS = [
    { id: "inline-q1", text: `Explain the main concept of ${pkg?.title ?? "this week's topic"} in your own words.`, type: "paragraph" },
    { id: "inline-q2", text: "Draw a diagram showing the relationship between the key variables.", type: "canvas" },
    { id: "inline-q3", text: "Describe one real-world application of this week's topic.", type: "paragraph" },
  ]

  useEffect(() => {
    if (!profile?.id || !pkg?.id) return
    fetch(`/api/student-work?package_id=${pkg.id}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const m: Record<string, any> = {}
        data.forEach((a) => {
          m[a.question_id] = { text: a.answer_text ?? "", canvas: a.canvas_data ?? "", id: a.id, score: a.score, feedback: a.feedback, status: a.status }
        })
        setAnswers(m)
        const qIds = QUESTIONS.map(q => q.id)
        const done = qIds.every(qid => m[qid]?.id)
        setAllSubmitted(done)
      })
      .catch(() => {})
  }, [profile, pkg])

  function updateAnswer(qId: string, field: string, val: string) {
    setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] ?? {}), [field]: val } }))
  }

  async function handleSubmit(qId: string) {
    const a = answers[qId]
    if (!a || (!a.text && !a.canvas)) { toast.error("Please answer first."); return }
    setSubmitting(qId)
    const q = QUESTIONS.find(q => q.id === qId)
    const payload = { package_id: pkg?.id, question_id: qId, question_text: q?.text ?? "", question_type: q?.type ?? "paragraph", answer_text: a.text || null, canvas_data: a.canvas || null, max_score: 10 }
    try {
      const res = a.id
        ? await fetch(`/api/student-work/${a.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/student-work", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) { const d = await res.json(); setAnswers(prev => ({ ...prev, [qId]: { ...(prev[qId] ?? {}), id: d.id, status: "submitted" } })); toast.success("Answer submitted!"); checkAll() }
      else toast.error("Failed")
    } catch { toast.error("Failed") }
    finally { setSubmitting(null) }
  }

  function checkAll() {
    const done = QUESTIONS.every(q => answers[q.id]?.id)
    if (done) setAllSubmitted(true)
  }

  const lp = pkg?.lesson_plan as Record<string, unknown> | undefined
  const phases = (lp?.phases as Array<Record<string, unknown>>) ?? []
  const ws = pkg?.worksheet as Record<string, unknown> | undefined
  const levels = (ws?.levels as Array<Record<string, unknown>>) ?? []
  const pc = pkg?.pre_class as Record<string, unknown> | undefined
  const vr = pc?.video_resource as { title?: string; url?: string; source?: string; duration_minutes?: number; key_concepts?: string[]; watch_guide?: string } | undefined
  const sim = pc?.interactive_simulation as { title?: string; url?: string; platform?: string; instructions?: string; inquiry_questions?: string[] } | undefined

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Week</h1>
          <p className="text-sm text-muted-foreground">Grade {grade} — Week {thisWeek}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{pkg?.topic ?? "—"}</Badge>
          {allSubmitted && <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" />All Done</Badge>}
        </div>
      </div>

      {!pkg ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No published package for this week.</CardContent></Card>
      ) : (
        <>
          {/* ===== TASK 1: Pre-Class ===== */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Video className="h-4 w-4 text-blue-500" />Pre-Class Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {vr && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div><p className="font-medium text-sm">{vr.title ?? ""}</p><p className="text-xs text-muted-foreground">{vr.duration_minutes} min · {vr.source ?? ""}</p></div>
                  <Button size="sm" variant="outline" onClick={() => router.push("/pre-class")}><ExternalLink className="mr-1 h-3 w-3" />Watch</Button>
                </div>
              )}
              {sim && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div><p className="font-medium text-sm">{sim.title as string}</p><p className="text-xs text-muted-foreground">{sim.platform as string}</p></div>
                  <Button size="sm" variant="outline" onClick={() => window.open(sim.url as string, "_blank")}><ExternalLink className="mr-1 h-3 w-3" />Open</Button>
                </div>
              )}
              <Button size="sm" variant="default" onClick={() => router.push("/pre-class")}>
                <ArrowRight className="mr-1 h-3 w-3" />Go to Pre-Class
              </Button>
            </CardContent>
          </Card>

          {/* ===== TASK 2: Answer Questions (Inline) ===== */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><PenTool className="h-4 w-4 text-green-500" />Weekly Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {QUESTIONS.map((q, idx) => {
                const a = answers[q.id]
                const isSubmitted = !!a?.id
                const isGraded = a?.status === "graded"
                return (
                  <div key={q.id}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">{idx + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.text}</p>
                        {isSubmitted && <Badge variant="outline" className="text-[10px] mt-1"><Clock className="mr-1 h-3 w-3" />Submitted</Badge>}
                        {isGraded && <Badge className="bg-green-100 text-green-700 text-[10px] mt-1"><CheckCircle className="mr-1 h-3 w-3" />Graded: {a.score}/10</Badge>}
                      </div>
                    </div>
                    {q.type === "paragraph" ? (
                      <textarea value={a?.text ?? ""} onChange={(e) => updateAnswer(q.id, "text", e.target.value)}
                        onPaste={(e) => { e.preventDefault(); toast.error("Paste disabled") }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}
                        rows={3} className="w-full rounded-lg border border-input bg-background p-3 text-sm resize-none" placeholder="Type your answer..." disabled={isSubmitted && !isGraded} />
                    ) : (
                      <CanvasWidget data={a?.canvas ?? ""} onChange={(d) => updateAnswer(q.id, "canvas", d)} readonly={isSubmitted && !isGraded} />
                    )}
                    {!isSubmitted && <Button size="sm" onClick={() => handleSubmit(q.id)} disabled={submitting === q.id}><Send className="mr-1 h-3 w-3" />{submitting === q.id ? "..." : "Submit"}</Button>}
                    {isSubmitted && !isGraded && <Button size="sm" variant="outline" onClick={() => handleSubmit(q.id)} disabled={submitting === q.id}>Resubmit</Button>}
                    {isGraded && a?.feedback && (
                      <div className="mt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowFb(p => ({ ...p, [q.id]: !p[q.id] }))}>
                          {showFb[q.id] ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}Feedback
                        </Button>
                        {showFb[q.id] && <p className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded">{a.feedback}</p>}
                      </div>
                    )}
                    {idx < QUESTIONS.length - 1 && <Separator className="mt-4" />}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* ===== TASK 3: Lesson Plan ===== */}
          {phases.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-500" />Lesson Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {phases.map((p, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between"><span className="font-medium text-sm">{p.phase as string}</span><Badge variant="outline" className="text-xs">{p.minutes as string} min</Badge></div>
                    {(p.hook_question as string) && <p className="mt-1 text-xs text-muted-foreground"><strong>Hook:</strong> {p.hook_question as string}</p>}
                    {(p.activity as string) && <p className="mt-1 text-xs text-muted-foreground">{p.activity as string}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ===== TASK 4: Worksheet ===== */}
          {levels.length > 0 && (
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500" />Worksheet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {levels.map((l, i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <p className="font-medium text-sm">Level {l.level as string}: {l.name as string} ({l.minutes as string} min)</p>
                    {((l.questions as Array<Record<string, unknown>>) ?? []).slice(0, 2).map((q, j) => (
                      <p key={j} className="mt-1 text-xs text-muted-foreground">Q{q.id as string}. {q.question as string}</p>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ===== DOWNLOAD TEMPLATES ===== */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" />Download Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["docx", "pdf", "md"] as const).map((fmt) => (
                  <Button key={fmt} variant="outline" size="sm" onClick={async () => {
                    try {
                      const res = await fetch(`/api/packages/${pkg.id}/lesson-plan-template?format=${fmt}`)
                      if (!res.ok) return
                      const blob = await res.blob(); const url = URL.createObjectURL(blob)
                      const a = document.createElement("a"); a.href = url; a.download = `lesson-plan-G${grade}-W${thisWeek}.${fmt === "docx" ? "docx" : fmt}`; a.click()
                      URL.revokeObjectURL(url)
                    } catch {}
                  }}>
                    {fmt.toUpperCase()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ===== LAB ===== */}
          {pkg.lab_logistics && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-red-500" />Lab</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {(pkg.lab_logistics as Record<string, unknown>)?.lab_required ? "Lab session this week. Check equipment list." : "No lab this week."}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
