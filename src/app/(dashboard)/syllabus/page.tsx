"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, BookOpen, BrainCircuit, CalendarDays, Lightbulb, Save, Plus, Trash2, FileDown, FileText, FileType, Wand2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GRADES } from "@/lib/utils/constants"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { generateSyllabusMD as generateSyllabusExport } from "@/lib/export"
import toast from "react-hot-toast"

interface SyllabusTopic {
  id: string
  grade: number
  unit_id: string
  topic: string
  subtopics: string[]
  syllabus_ref: string
  curriculum: string
  suggested_weeks: number[]
}

interface CalendarEvent {
  id: string
  week_number: number
  event_name: string
  event_type: string
  affected_grades: number[]
  start_date: string
  end_date: string
  is_holiday: boolean
  effective_days: number | null
}

interface SyllabusPlan {
  id?: string
  grade: number
  week_number: number
  topic: string
  subtopics: string[]
  opening_ideas: string
  activity_questions: { question: string; bloom?: string; timing?: string }[]
  problems: { problem: string; level?: string }[]
  calendar_status: string
  effective_days: number
  status: string
}

const FlippedPhases = [
  { phase: "Entry Ticket & Hook", minutes: 5, icon: "🎯" },
  { phase: "Productive Struggle", minutes: 20, icon: "💪" },
  { phase: "CER Challenge", minutes: 10, icon: "🔬" },
  { phase: "Wrap-up & Mistake Journal", minutes: 5, icon: "📝" },
]

const defaultPlan: SyllabusPlan = {
  grade: 10,
  week_number: 1,
  topic: "",
  subtopics: [],
  opening_ideas: "",
  activity_questions: [],
  problems: [],
  calendar_status: "normal",
  effective_days: 5,
  status: "draft",
}

export default function SyllabusPlannerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [generating, setGenerating] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number>(10)
  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeek())
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [plan, setPlan] = useState<SyllabusPlan>(defaultPlan)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [topicsRes, eventsRes, planRes] = await Promise.all([
        supabase.from("syllabus_topics").select("*").eq("grade", selectedGrade).order("unit_id"),
        supabase.from("academic_calendars").select("*").contains("affected_grades", [selectedGrade]).eq("week_number", selectedWeek).order("start_date"),
        supabase.from("syllabus_planning").select("*").eq("grade", selectedGrade).eq("week_number", selectedWeek).maybeSingle(),
      ])

      if (topicsRes.data) setTopics(topicsRes.data as SyllabusTopic[])
      if (eventsRes.data) setEvents(eventsRes.data as CalendarEvent[])
      if (planRes.data) {
        const p = planRes.data as Record<string, unknown>
        setPlan({
          id: p.id as string,
          grade: p.grade as number,
          week_number: p.week_number as number,
          topic: (p.topic as string) ?? "",
          subtopics: (p.subtopics as string[]) ?? [],
          opening_ideas: (p.opening_ideas as string) ?? "",
          activity_questions: (p.activity_questions as Array<{ question: string; bloom?: string; timing?: string }>) ?? [],
          problems: (p.problems as Array<{ problem: string; level?: string }>) ?? [],
          calendar_status: (p.calendar_status as string) ?? "normal",
          effective_days: (p.effective_days as number) ?? 5,
          status: (p.status as string) ?? "draft",
        })
        setSelectedTopicIds(new Set(p.subtopics as string[] ?? []))
      } else {
        setPlan({ ...defaultPlan, grade: selectedGrade, week_number: selectedWeek })
        setSelectedTopicIds(new Set())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedGrade, selectedWeek])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleTopic = (unitId: string) => {
    const next = new Set(selectedTopicIds)
    if (next.has(unitId)) next.delete(unitId)
    else next.add(unitId)
    setSelectedTopicIds(next)

    const selected = topics.filter(t => next.has(t.unit_id))
    setPlan(prev => ({
      ...prev,
      topic: selected.map(t => t.topic).join(" + "),
      subtopics: Array.from(next),
    }))
  }

  const addQuestion = () => {
    setPlan(prev => ({
      ...prev,
      activity_questions: [...prev.activity_questions, { question: "", bloom: "analyze", timing: "20 min" }],
    }))
  }

  const updateQuestion = (i: number, field: string, value: string) => {
    setPlan(prev => {
      const qs = [...prev.activity_questions]
      qs[i] = { ...qs[i], [field]: value }
      return { ...prev, activity_questions: qs }
    })
  }

  const removeQuestion = (i: number) => {
    setPlan(prev => ({
      ...prev,
      activity_questions: prev.activity_questions.filter((_, idx) => idx !== i),
    }))
  }

  const addProblem = () => {
    setPlan(prev => ({
      ...prev,
      problems: [...prev.problems, { problem: "", level: "L2" }],
    }))
  }

  const updateProblem = (i: number, field: string, value: string) => {
    setPlan(prev => {
      const ps = [...prev.problems]
      ps[i] = { ...ps[i], [field]: value }
      return { ...prev, problems: ps }
    })
  }

  const removeProblem = (i: number) => {
    setPlan(prev => ({
      ...prev,
      problems: prev.problems.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSave(silent = false) {
    if (!plan.topic) {
      if (!silent) toast.error("Select at least one topic")
      return false
    }

    try {
      const { error } = await (supabase.from("syllabus_planning") as any).upsert({
        grade: selectedGrade,
        week_number: selectedWeek,
        academic_year: "2026-2027",
        topic: plan.topic,
        subtopics: Array.from(selectedTopicIds),
        opening_ideas: plan.opening_ideas,
        activity_questions: plan.activity_questions,
        problems: plan.problems,
        calendar_status: (events ?? []).find(e => e.event_type !== "holiday")?.event_type ?? "normal",
        effective_days: (events ?? [])[0]?.effective_days ?? 5,
        status: "planned",
      })

      if (error) throw error
      if (!silent) toast.success("Syllabus plan saved!")
      setPlan(prev => ({ ...prev, status: "planned" }))
      return true
    } catch (e) {
      if (!silent) toast.error("Failed to save: " + (e instanceof Error ? e.message : "Unknown"))
      return false
    }
  }

  async function handleGenerate() {
    if (!plan.topic) {
      toast.error("Select at least one topic first")
      return
    }

    setGenerating(true)

    if (!plan.opening_ideas && plan.activity_questions.length === 0 && plan.problems.length === 0) {
      try {
        const res = await fetch("/api/agents/generate-syllabus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: selectedGrade,
            week: selectedWeek,
            topic: plan.topic,
            subtopics: Array.from(selectedTopicIds),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const suggestions = data.suggestions ?? data
          setPlan((prev) => ({
            ...prev,
            opening_ideas: suggestions.opening_ideas ?? prev.opening_ideas,
            activity_questions: suggestions.activity_questions?.length > 0 ? suggestions.activity_questions : prev.activity_questions,
            problems: suggestions.problems?.length > 0 ? suggestions.problems : prev.problems,
          }))
          toast.success("Syllabus content generated! Review and save.")
        } else {
          toast.success("No AI provider — generating package directly.")
        }
      } catch {
        toast.success("Generating package now...")
      }
    }

    try {
      const saved = await handleSave(true)
      if (!saved) {
        toast.error("Failed to save plan")
        setGenerating(false)
        return
      }

      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: selectedGrade }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }))
        toast.error(err.error ?? "Generation failed")
        setGenerating(false)
        return
      }

      toast.success("Package generated! Redirecting...")
      setTimeout(() => { router.push(`/grades/${selectedGrade}/${selectedWeek}`) }, 1500)
    } catch (e) {
      toast.error("Generate failed: " + (e instanceof Error ? e.message : "Unknown"))
      setGenerating(false)
    }
  }

  async function handleAIGenerate() {
    if (!plan.topic) { toast.error("Select at least one topic first"); return }
    setGeneratingAI(true)
    try {
      const res = await fetch("/api/agents/generate-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: selectedGrade, week: selectedWeek, topic: plan.topic, subtopics: Array.from(selectedTopicIds) }),
      })
      const data = await res.json()
      setPlan((prev) => ({
        ...prev,
        opening_ideas: data.opening_ideas ?? prev.opening_ideas,
        activity_questions: data.activity_questions?.length > 0 ? data.activity_questions : prev.activity_questions,
        problems: data.problems?.length > 0 ? data.problems : prev.problems,
      }))
      toast.success("AI content generated! Review before saving.")
    } catch { toast.error("AI generation failed") }
    finally { setGeneratingAI(false) }
  }

  function generateSyllabusMD(): string {
    const curriculum = topics.find(t => selectedTopicIds.has(t.unit_id))?.curriculum ?? "Cambridge"
    const refs = topics.filter(t => selectedTopicIds.has(t.unit_id)).map(t => t.syllabus_ref).filter(Boolean).join(", ")
    return generateSyllabusExport(
      selectedGrade, selectedWeek, plan.topic,
      plan.opening_ideas,
      plan.activity_questions.map(q => ({ ...q })),
      plan.problems.map(p => ({ ...p })),
      events.map(e => ({ event_name: e.event_name, event_type: e.event_type })),
      curriculum, refs,
    )
  }

  async function downloadSyllabus(format: string) {
    setDownloading(format)
    try {
      if (format === "md") {
        const md = generateSyllabusMD()
        const blob = new Blob([md], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a"); a.href = url; a.download = `syllabus-G${selectedGrade}-W${selectedWeek}.md`; a.click()
        URL.revokeObjectURL(url)
        toast.success("MD downloaded!")
      } else {
        // DOCX, PDF, QMD — use the lesson plan generator with syllabus content as activities/opening
        const isJHS = selectedGrade <= 9
        const res = await fetch("/api/lesson-plan/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            format,
            vars: {
              grade: selectedGrade,
              week: selectedWeek,
              year: "2026/2027",
              semester: "Semester 1",
              subject: "Physics",
              teacher: "",
              ssbat: `Students will be able to analyse and apply concepts related to ${plan.topic}.`,
              opening: plan.opening_ideas || "Engage students with a real-world phenomenon.",
              activities: plan.activity_questions.map(q => `Q: ${q.question} (${q.bloom}, ${q.timing ?? "20 min"})`).join("\n") || "Guided worksheet and group work.",
              closing: "Students summarise key concepts. Teacher clarifies misconceptions.",
              model: plan.calendar_status === "exam" ? "Exam Review" : "Flipped Classroom",
              assessment: `Formative through worksheet and CER challenge on ${plan.topic}.`,
              resources: "",
              vp: isJHS ? "Christina Sri Waryanti, S.Pd." : "Aji Wahyu Budiyanto, M.Si",
              principal: isJHS ? "Sisilia Juni Arianti, S.Pd., M.Pd." : "Dr Agustinus Joko Purwanto, S.Pd., M.M.",
              unit: "Academic",
              problem_solving: plan.problems.map(p => `${p.problem} (${p.level})`).join("\n"),
            },
          }),
        })
        if (!res.ok) { toast.error("Download failed"); return }
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const ext = format === "qmd" ? "qmd" : format
        const a = document.createElement("a"); a.href = url; a.download = `syllabus-G${selectedGrade}-W${selectedWeek}.${ext}`; a.click()
        URL.revokeObjectURL(url)
        toast.success(`${format.toUpperCase()} downloaded!`)
      }
    } catch { toast.error("Download failed") }
    finally { setDownloading(null) }
  }

  const hasConflict = events.some(e => e.is_holiday || e.event_type === "blackout")
  const eventBadgeVariant = hasConflict ? "destructive" : events.length > 0 ? "secondary" : "outline"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Planner</h1>
          <p className="text-sm text-muted-foreground">
            Select topics and plan your Flipped Classroom lesson per week
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button onClick={handleAIGenerate} disabled={loading || generatingAI} variant="outline" size="sm">
            <Wand2 className="mr-1 h-3 w-3" />
            {generatingAI ? "AI Generating..." : "AI Fill"}
          </Button>
          <Button onClick={handleGenerate} disabled={loading || generating} size="sm">
            <BrainCircuit className="mr-1 h-4 w-4" />
            {generating ? "Generating..." : "Generate Pkg"}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={() => handleSave()} disabled={loading} variant="outline" size="sm">
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
          {(["md", "docx", "pdf", "qmd"] as const).map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => downloadSyllabus(fmt)} disabled={downloading === fmt}>
              {fmt === "docx" ? <FileDown className="mr-1 h-3 w-3" /> : fmt === "pdf" ? <FileText className="mr-1 h-3 w-3" /> : <FileType className="mr-1 h-3 w-3" />}
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="font-medium">Grade</Label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="font-medium">Week</Label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: 43 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
        <Badge variant={eventBadgeVariant} className="gap-1">
          <CalendarDays className="h-3 w-3" />
          {events.length > 0
            ? events.map(e => e.event_name).join(", ")
            : "No events"}
        </Badge>
        {plan.status === "planned" && (
          <Badge variant="default" className="gap-1">
            <BookOpen className="h-3 w-3" />
            Planned
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Syllabus Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No topics found for this grade.</p>
              ) : (
                topics.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <Checkbox
                      checked={selectedTopicIds.has(t.unit_id)}
                      onCheckedChange={() => toggleTopic(t.unit_id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.unit_id}</span>
                        <span className="text-sm">{t.topic}</span>
                        <Badge variant="outline" className="text-xs">{t.curriculum}</Badge>
                      </div>
                      {t.subtopics.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.subtopics.map((st, i) => (
                            <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{st}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Opening Ideas (Hook / MythBuster)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plan.opening_ideas}
                onChange={(e) => setPlan(prev => ({ ...prev, opening_ideas: e.target.value }))}
                placeholder="e.g. 'Why do astronauts float if gravity is 90% as strong in orbit?' — real-world hook to spark curiosity..."
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Phase 1 (5 min): Entry Ticket & Hook — a provocative question or myth to engage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Questions (Productive Struggle)</CardTitle>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="mr-1 h-3 w-3" /> Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.activity_questions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add Level 1-2 questions for the Productive Struggle phase (20 min).
                </p>
              )}
              {plan.activity_questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(i, "question", e.target.value)}
                      placeholder={`Question ${i + 1}`}
                    />
                    <div className="flex gap-2">
                      <select
                        value={q.bloom ?? "analyze"}
                        onChange={(e) => updateQuestion(i, "bloom", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="remember">Remember</option>
                        <option value="understand">Understand</option>
                        <option value="apply">Apply</option>
                        <option value="analyze">Analyze</option>
                        <option value="evaluate">Evaluate</option>
                        <option value="create">Create</option>
                      </select>
                      <select
                        value={q.timing ?? "20 min"}
                        onChange={(e) => updateQuestion(i, "timing", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="10 min">10 min (Level 1)</option>
                        <option value="20 min">20 min (Level 2)</option>
                        <option value="10 min CER">10 min (Level 3 CER)</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Problems (CER / HOTS)</CardTitle>
              <Button variant="outline" size="sm" onClick={addProblem}>
                <Plus className="mr-1 h-3 w-3" /> Add Problem
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.problems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add Level 3 CER Challenge problems (10 min) or HOTS past paper questions.
                </p>
              )}
              {plan.problems.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={p.problem}
                      onChange={(e) => updateProblem(i, "problem", e.target.value)}
                      placeholder={`Problem ${i + 1}`}
                    />
                    <div className="flex gap-2">
                      <select
                        value={p.level ?? "L2"}
                        onChange={(e) => updateProblem(i, "level", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="L1">L1: Sanity Check</option>
                        <option value="L2">L2: Mistake Hunter</option>
                        <option value="L3">L3: CER Challenge</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProblem(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events this week.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.event_name}</span>
                      <Badge variant={e.is_holiday ? "destructive" : "secondary"} className="text-xs">
                        {e.event_type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.start_date} — {e.end_date}
                    </p>
                    {e.effective_days && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Effective days: {e.effective_days}
                      </p>
                    )}
                    {e.is_holiday && (
                      <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Holiday — adjust teaching plan
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Flipped Classroom
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">40-minute structure:</p>
              {FlippedPhases.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{f.icon} {f.phase}</span>
                  <Badge variant="outline">{f.minutes} min</Badge>
                </div>
              ))}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                <strong>HARD RULES:</strong> No calculus. CER required Level 3. "Ask 3 Before Me". "No Eraser". Mistake Journal every lesson.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
              SHB Load
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours/week:</span>
                <span className="font-medium">{selectedGrade <= 10 ? 3 : 4}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective days:</span>
                <span className="font-medium">{events[0]?.effective_days ?? 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lesson duration:</span>
                <span className="font-medium">40 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Curriculum:</span>
                <span className="font-medium">
                  {selectedGrade <= 8 ? "Lower Sec" : selectedGrade <= 10 ? "IGCSE" : selectedGrade === 11 ? "AS Level" : "A Level + TKA"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
