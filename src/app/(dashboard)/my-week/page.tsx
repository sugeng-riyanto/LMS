"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Video, FlaskConical, PenTool, FileText, CheckCircle, Clock, Download, ExternalLink, ArrowRight, Award, BarChart3, BrainCircuit, ListChecks, Target, TrendingUp } from "lucide-react"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

const CAT_WEIGHTS: Record<string, number> = { classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1 }
const CAT_LABELS: Record<string, string> = { classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester" }
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"]

export default function MyWeekPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const grade = profile?.grade_assigned ?? 0
  const thisWeek = getCurrentWeek()
  const { data: packages, isLoading } = usePackages({ grade, status: "published" })
  const pkg = packages?.find((p: any) => p.week === thisWeek)

  const [progress, setProgress] = useState<any>(null)
  const [workStatus, setWorkStatus] = useState<{ submitted: number; total: number; graded: number; score: number | null }>({ submitted: 0, total: 3, graded: 0, score: null })

  useEffect(() => {
    if (!profile?.id) return
    // Fetch progress + work status
    Promise.all([
      fetch("/api/student/progress").then(r => r.json()).catch(() => null),
      fetch(`/api/student-work?${pkg?.id ? `package_id=${pkg.id}` : ""}`).then(r => r.json()).catch(() => []),
    ]).then(([p, works]) => {
      if (p) setProgress(p)
      if (Array.isArray(works)) {
        const submitted = works.length
        const graded = works.filter((w: any) => w.status === "graded").length
        const scores = works.filter((w: any) => w.score !== null).map((w: any) => w.score)
        const avgScore = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length * 10 : null
        setWorkStatus({ submitted, total: 3, graded, score: avgScore })
      }
    }).catch(() => {})
  }, [profile, pkg])

  const lp = pkg?.lesson_plan as Record<string, unknown> | undefined
  const phases = (lp?.phases as Array<Record<string, unknown>>) ?? []
  const ws = pkg?.worksheet as Record<string, unknown> | undefined
  const levels = (ws?.levels as Array<{ level?: string; name?: string; minutes?: number }>) ?? []
  const pc = pkg?.pre_class as Record<string, unknown> | undefined
  const isMarkdownPC = pc && typeof pc === "object" && ((pc as any).video && !(pc as any).video_resource)
  const vr = pc?.video_resource as { title?: string; duration_minutes?: number } | undefined
  const broadcast = pkg?.wa_blast as string | null

  const nextWeekTopic = ["Thermal Physics", "Kinematics", "Forces", "Energy", "Waves", "Electricity", "Magnetism", "Density", "Pressure", "Light"][thisWeek % 10]

  // Score weight pie chart segments
  const breakdown = progress?.breakdown ?? []
  const pieTotal = breakdown.reduce((s: number, b: any) => s + (b.average || 0), 0) || 1
  let cum = 0
  const pieSegments = breakdown.map((b: any, i: number) => {
    const start = (cum / pieTotal) * 360; cum += (b.average || 0); const end = (cum / pieTotal) * 360
    return { ...b, start, end, color: COLORS[i % COLORS.length] }
  })

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Week</h1>
          <p className="text-sm text-muted-foreground">Grade {grade} · Week {thisWeek} · {pkg?.topic ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {workStatus.submitted > 0 && <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" />{workStatus.submitted}/3 done</Badge>}
          {workStatus.graded > 0 && <Badge className="bg-green-100 text-green-700"><Award className="mr-1 h-3 w-3" />{workStatus.score?.toFixed(0) ?? "—"}%</Badge>}
          {progress?.weighted_total !== undefined && <Badge variant="outline">Overall: {progress.weighted_total.toFixed(1)}%</Badge>}
        </div>
      </div>

      {!pkg ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No published package for this week.</CardContent></Card>
      ) : (
        <>
          {/* BROADCAST */}
          {broadcast && <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-4"><p className="whitespace-pre-wrap text-sm">{broadcast}</p></CardContent></Card>}

          {/* MAIN GRID */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* LEFT: Tasks */}
            <div className="lg:col-span-2 space-y-4">
              {/* Lesson Summary */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-500" />Lesson Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {phases.length > 0 ? phases.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-700">{i + 1}</div>
                      <div>
                        <p className="font-medium">{p.phase as string} ({p.minutes as string} min)</p>
                        <p className="text-xs text-muted-foreground">{(p.activity as string)?.slice(0, 120)}...</p>
                      </div>
                    </div>
                  )) : <p className="text-muted-foreground">No lesson plan.</p>}
                </CardContent>
              </Card>

              {/* Tasks */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><ListChecks className="h-4 w-4 text-green-500" />Tasks</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <TaskRow icon={<Video className="h-4 w-4" />} label="Pre-Class Video" status={vr ? "ready" : "none"} action={<Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push("/pre-class")}><ExternalLink className="mr-1 h-3 w-3" />Open</Button>} />
                  <TaskRow icon={<PenTool className="h-4 w-4" />} label="Weekly Questions" status={workStatus.submitted >= workStatus.total ? "done" : workStatus.submitted > 0 ? "partial" : "pending"} detail={`${workStatus.submitted}/${workStatus.total} answered`} action={<Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => router.push("/my-work")}><ArrowRight className="mr-1 h-3 w-3" />{workStatus.submitted > 0 ? "Continue" : "Answer"}</Button>} />
                  <TaskRow icon={<FlaskConical className="h-4 w-4" />} label="Lab Session" status={pkg.lab_logistics ? "ready" : "none"} detail={(pkg.lab_logistics as Record<string, unknown>)?.lab_required ? "Equipment ready" : "No lab"} />
                  <TaskRow icon={<FileText className="h-4 w-4" />} label="Worksheet" status={levels.length > 0 ? "ready" : "none"} detail={`${levels.length} levels`} />
                </CardContent>
              </Card>

              {/* Next Lesson */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-blue-500" />Next Lesson</CardTitle></CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">Week {thisWeek + 1}: {nextWeekTopic}</p>
                  <p className="text-xs text-muted-foreground mt-1">Prepare by watching the pre-class video and completing the guided notes.</p>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT: Scores */}
            <div className="space-y-4">
              {/* Overall Score */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4" />My Score</CardTitle></CardHeader>
                <CardContent className="text-center">
                  <p className={`text-3xl font-bold ${(progress?.weighted_total ?? 0) >= 60 ? "text-green-600" : "text-red-600"}`}>
                    {progress?.weighted_total?.toFixed(1) ?? "—"}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Overall weighted</p>
                </CardContent>
              </Card>

              {/* Score Weights Pie */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Score Weights</CardTitle></CardHeader>
                <CardContent>
                  {breakdown.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <svg viewBox="0 0 100 100" className="w-32 h-32">
                        {pieSegments.map((s: any, i: number) => {
                          const r = 38, cx = 50, cy = 50
                          const sr = ((s.start - 90) * Math.PI) / 180, er = ((s.end - 90) * Math.PI) / 180
                          const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr)
                          const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er)
                          return <path key={i} d={`M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${s.end - s.start > 180 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={s.color} stroke="#fff" strokeWidth={1} />
                        })}
                        <circle cx={50} cy={50} r={20} fill="#fff" />
                        <text x={50} y={48} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#1a1a2e">{(progress?.weighted_total ?? 0).toFixed(0)}%</text>
                        <text x={50} y={58} textAnchor="middle" fontSize={5} fill="#64748b">total</text>
                      </svg>
                      <div className="w-full mt-2 space-y-1">
                        {breakdown.map((b: any, i: number) => (
                          <div key={b.category} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span>{CAT_LABELS[b.category] || b.category}</span></div>
                            <span className="font-medium">{(b.average || 0).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground">No scores yet.</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Complete tasks to see your progress.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grade Rules */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Grading Weights</CardTitle></CardHeader>
                <CardContent className="space-y-1.5 text-xs">
                  {Object.entries(CAT_WEIGHTS).map(([key, w]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{CAT_LABELS[key]}</span>
                      <span className="font-medium">{(w * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                  <Separator className="my-1" />
                  <div className="flex items-center justify-between font-medium">
                    <span>Total</span><span>100%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Downloads */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" />Downloads</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(["docx", "pdf", "md"] as const).map((fmt) => (
                    <Button key={fmt} variant="outline" size="sm" className="h-7 text-xs" onClick={async () => {
                      try {
                        const res = await fetch(`/api/packages/${pkg.id}/lesson-plan-template?format=${fmt}`)
                        if (!res.ok) return
                        const blob = await res.blob(); const url = URL.createObjectURL(blob)
                        const a = document.createElement("a"); a.href = url; a.download = `week-${thisWeek}.${fmt}`; a.click()
                        URL.revokeObjectURL(url)
                      } catch {}
                    }}>{fmt.toUpperCase()}</Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function TaskRow({ icon, label, status, detail, action }: { icon: React.ReactNode; label: string; status: string; detail?: string; action?: React.ReactNode }) {
  const statusIcon = status === "done" ? <CheckCircle className="h-3 w-3 text-green-500" /> : status === "partial" ? <Clock className="h-3 w-3 text-amber-500" /> : status === "pending" ? <Clock className="h-3 w-3 text-muted-foreground" /> : null
  return (
    <div className="flex items-center justify-between rounded-lg border p-2.5">
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <p className="font-medium text-xs">{label}</p>
          {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {statusIcon}{action}
      </div>
    </div>
  )
}
