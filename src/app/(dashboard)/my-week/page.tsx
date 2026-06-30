"use client"

import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Video, FlaskConical, PenTool, FileText, CheckCircle, Clock, Download, ExternalLink, ArrowRight } from "lucide-react"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { useRouter } from "next/navigation"

export default function MyWeekPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const thisWeek = getCurrentWeek()
  const { data: packages, isLoading } = usePackages({ grade, status: "published" })
  const pkg = packages?.find((p: any) => p.week === thisWeek)

  const lp = pkg?.lesson_plan as Record<string, unknown> | undefined
  const phases = (lp?.phases as Array<Record<string, unknown>>) ?? []
  const ws = pkg?.worksheet as Record<string, unknown> | undefined
  const levels = (ws?.levels as Array<{ level?: string; name?: string; minutes?: number; questions?: Array<Record<string, unknown>> }>) ?? []
  const pc = pkg?.pre_class as Record<string, unknown> | undefined
  const vr = pc?.video_resource as { title?: string; url?: string; source?: string; duration_minutes?: number } | undefined
  const sim = pc?.interactive_simulation as { title?: string; url?: string; platform?: string } | undefined
  const broadcast = pkg?.wa_blast as string | null

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Week</h1>
          <p className="text-sm text-muted-foreground">Grade {grade} — Week {thisWeek}</p>
        </div>
        <Badge variant="outline">{pkg?.topic ?? "—"}</Badge>
      </div>

      {!pkg ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No published package for this week.</CardContent></Card>
      ) : (
        <>
          {broadcast && <Card className="border-primary/30 bg-primary/5"><CardContent className="pt-6"><p className="whitespace-pre-wrap text-sm">{broadcast}</p></CardContent></Card>}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Video className="h-4 w-4 text-blue-500" />Pre-Class</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {vr && <p><strong>Video:</strong> {vr.title as string} ({vr.duration_minutes} min)</p>}
                {sim && <p><strong>Simulation:</strong> {sim.title as string}</p>}
                <Button size="sm" variant="outline" onClick={() => router.push("/pre-class")}><ExternalLink className="mr-1 h-3 w-3" />Open</Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><PenTool className="h-4 w-4 text-green-500" />Weekly Work</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Answer 3 questions about this week's topic.</p>
                <Button size="sm" variant="outline" onClick={() => router.push("/my-work")}><ArrowRight className="mr-1 h-3 w-3" />Answer</Button>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-purple-500" />Lesson</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {phases.length > 0 ? phases.slice(0, 2).map((p, i) => <p key={i}><strong>{p.phase as string}:</strong> {(p.activity as string)?.slice(0, 80)}…</p>) : <p>No lesson plan.</p>}
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-orange-500" />Worksheet</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {levels.length > 0 ? levels.map((l, i) => <p key={i}>Level {l.level as string}: {l.name as string} ({l.minutes} min)</p>) : <p>No worksheet.</p>}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" />Downloads</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["docx", "pdf", "md"] as const).map((fmt) => (
                  <Button key={fmt} variant="outline" size="sm" onClick={async () => {
                    try {
                      const res = await fetch(`/api/packages/${pkg.id}/lesson-plan-template?format=${fmt}`)
                      if (!res.ok) return
                      const blob = await res.blob(); const url = URL.createObjectURL(blob)
                      const a = document.createElement("a"); a.href = url; a.download = `lesson-plan-G${grade}-W${thisWeek}.${fmt}`; a.click()
                      URL.revokeObjectURL(url)
                    } catch {}
                  }}>{fmt.toUpperCase()}</Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {pkg.lab_logistics && (
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-red-500" />Lab</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {(pkg.lab_logistics as Record<string, unknown>)?.lab_required ? "Lab session this week." : "No lab this week."}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
