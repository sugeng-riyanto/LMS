"use client"

import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, FileQuestion, FlaskConical, ExternalLink, Video, MousePointerClick } from "lucide-react"
import { getCurrentWeek } from "@/lib/utils/week-calculator"

interface LessonPlanPhase {
  phase: string
  minutes?: number
  activity?: string
  hook_question?: string
  mythbuster_or_analogy?: string
  cer_template?: string
  reflection_prompt?: string
}

interface WorksheetLevel {
  level: number
  name?: string
  minutes?: number
  questions: Array<{ id: string; type: string; question: string; bloom?: string; mark_scheme?: string }>
}

interface PreClassMaterial {
  video_resource?: { title: string; url: string; source: string; duration_minutes: number; key_concepts?: string[]; watch_guide?: string }
  interactive_simulation?: { title: string; url: string; platform?: string; instructions?: string; inquiry_questions?: string[] }
  guided_notes?: { title: string; fill_in_blanks?: Array<{ prompt: string; answer: string }> }
  entry_ticket_quiz?: { questions?: Array<{ question: string; options: string[]; correct: number; explanation?: string }>; passing_score?: number }
}

interface BroadcastMessage {
  wa_message?: string
  lms_post?: { title?: string; body?: string; deadline?: string }
  parent_message?: string
}

export default function MyWeekPage() {
  const { profile } = useAuth()
  const grade = profile?.grade ?? 0
  const { data: packages, isLoading } = usePackages({ grade, status: "published" })

  const thisWeek = getCurrentWeek()
  const currentPkg = packages?.find((p) => p.week === thisWeek)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!currentPkg) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Week</h1>
          <p className="text-muted-foreground">Your current week&apos;s materials</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No Package Yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No published package for Grade {grade} this week. Check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const lessonPlan = (currentPkg as any).lesson_plan as LessonPlanPhase[] | null
  const worksheet = (currentPkg as any).worksheet as { levels?: WorksheetLevel[]; title?: string } | null
  const preClass = (currentPkg as any).pre_class as PreClassMaterial | null
  const broadcast = (currentPkg as any).wa_blast as string | null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Week</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary">Week {thisWeek}</Badge>
          <Badge variant="outline">{currentPkg.title}</Badge>
        </div>
      </div>

      {broadcast && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <p className="whitespace-pre-wrap text-sm">{broadcast}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Lesson Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!lessonPlan?.length ? (
            <p className="text-sm text-muted-foreground">No lesson plan available.</p>
          ) : (
            <div className="space-y-3">
              {lessonPlan.map((phase, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{phase.phase} {phase.minutes ? `(${phase.minutes}m)` : ""}</span>
                  </div>
                  {phase.hook_question && <p className="mt-1 text-sm italic text-primary">❝ {phase.hook_question} ❞</p>}
                  {phase.activity && <p className="mt-1 text-sm text-muted-foreground">{phase.activity}</p>}
                  {phase.mythbuster_or_analogy && <p className="mt-1 text-xs text-amber-600">💡 {phase.mythbuster_or_analogy}</p>}
                  {phase.cer_template && <pre className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{phase.cer_template}</pre>}
                  {phase.reflection_prompt && <p className="mt-1 text-xs text-muted-foreground italic">{phase.reflection_prompt}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-primary" />
            Worksheet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!worksheet?.levels?.length ? (
            <p className="text-sm text-muted-foreground">No worksheet available.</p>
          ) : (
            <div className="space-y-4">
              {worksheet.levels.map((level, i) => (
                <div key={i}>
                  <h3 className="mb-2 text-sm font-semibold">
                    Level {level.level}: {level.name} ({level.minutes}m)
                  </h3>
                  <div className="space-y-2">
                    {level.questions.map((q, j) => (
                      <div key={j} className="rounded-lg border p-3 text-sm">
                        <p><span className="font-medium">{q.id}</span> {q.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{q.bloom} &middot; {q.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Pre-Class Materials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preClass?.video_resource && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{preClass.video_resource.title}</span>
                <Badge variant="outline" className="text-xs">{preClass.video_resource.duration_minutes}m</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{preClass.video_resource.source}</p>
              {preClass.video_resource.watch_guide && (
                <p className="mt-1 text-xs italic">{preClass.video_resource.watch_guide}</p>
              )}
            </div>
          )}
          {preClass?.interactive_simulation && (
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{preClass.interactive_simulation.title}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{preClass.interactive_simulation.instructions}</p>
            </div>
          )}
          {!preClass?.video_resource && !preClass?.interactive_simulation && (
            <p className="text-sm text-muted-foreground">No pre-class materials available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
