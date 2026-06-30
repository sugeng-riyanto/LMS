"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePackages, useUpdatePackage } from "@/hooks/use-packages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Save, FileDown, FileText, Upload } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"

interface LessonPhase {
  phase: string
  timing: string
  activity: string
}

interface WorksheetLevel {
  level: string
  questions: Array<{ question: string; points: number }>
}

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
}

interface PreClass {
  video: string
  simulation: string
  quiz: QuizQuestion[]
}

interface LabItem {
  item: string
  quantity: number
  notes: string
}

interface AnswerKey {
  question: string
  answer: string
  explanation: string
}

interface PackageContent {
  lesson_plan: LessonPhase[]
  worksheet: WorksheetLevel[]
  pre_class: PreClass
  lab_logistics: LabItem[]
  wa_blast: string
  answer_keys: AnswerKey[]
}

const defaultContent: PackageContent = {
  lesson_plan: [{ phase: "", timing: "", activity: "" }],
  worksheet: [{ level: "basic", questions: [{ question: "", points: 1 }] }],
  pre_class: { video: "", simulation: "", quiz: [{ question: "", options: ["", "", "", ""], answer: "" }] },
  lab_logistics: [{ item: "", quantity: 1, notes: "" }],
  wa_blast: "",
  answer_keys: [{ question: "", answer: "", explanation: "" }],
}

export default function EditPackagePage() {
  const params = useParams()
  const router = useRouter()
  const grade = Number(params.grade)
  const week = Number(params.week)
  const { data: packages } = usePackages({ grade, week })
  const pkg = packages?.[0]
  const { mutateAsync: updatePackage, isPending } = useUpdatePackage()
  const [activeTab, setActiveTab] = useState("lesson-plan")
  const [content, setContent] = useState<PackageContent>(defaultContent)
  const [loadingTemplate, setLoadingTemplate] = useState(false)

  // Template downloads per section
  const TEMPLATES: Record<string, { md: string }> = {
    "lesson-plan": {
      md: `## Phase 1: Entry Ticket & Hook (5 min)\n\n**Hook Question:** Write your hook question here.\n**Activity:** Describe the entry activity.\n**MythBuster:** Common misconception to address.\n\n## Phase 2: Productive Struggle (20 min)\n\n**Activity:** Describe the main activity.\n**Group Rule:** Collaboration guidelines.\n\n## Phase 3: CER Challenge (10 min)\n\n**Phenomenon:** Describe the phenomenon.\n**CER Template:** CLAIM / EVIDENCE / REASONING\n\n## Phase 4: Wrap-up & Mistake Journal (5 min)\n\n**Reflection Prompt:** Write reflection questions.`,
    },
    worksheet: {
      md: `## Level 1: Sanity Check (10 min)\n\n1. Question 1\n   A) Option A\n   B) Option B\n   C) Option C\n   D) Option D\n\n## Level 2: Mistake Hunter (15 min)\n\nA word problem with an intentional error embedded.\n\n## Level 3: CER Challenge (10 min)\n\nPhenomenon description. Students write Claim, Evidence, Reasoning.`,
    },
    "pre-class": {
      md: `### Video Resource\n- **Title:** \n- **URL:** \n- **Duration:** min\n- **Key Concepts:** \n\n### Interactive Simulation\n- **Title:** \n- **URL:** \n- **Instructions:** \n\n### Entry Ticket Quiz\n1. Question\n   A) \n   B) \n   C) \n   D) \n\n*Passing score: 2/3*`,
    },
    lab: {
      md: `| Item | Qty | Status |\n|------|-----|--------|\n|  |  | available |\n\n**Setup Instructions:**\n1. \n2. \n\n**Safety Notes:**\n- \n\n**Lab Message:**`,
    },
    "wa-blast": {
      md: `*📢 WEEKLY UPDATE*\n\nGreetings students!\n\nThis week we will explore **[topic]**.\n\n📋 **Schedule:**\n📖 Day 1 — Pre-class review\n📝 Day 2 — Worksheet\n🧪 Day 3 — Lab\n\nKeep learning! 🚀`,
    },
    answers: {
      md: `### Question 1\n**Answer:** \n**Explanation:** \n\n### Question 2\n**Answer:** \n**Explanation:** `,
    },
  }

  function downloadTemplate(section: string) {
    const tpl = TEMPLATES[section]
    if (!tpl) return
    const blob = new Blob([tpl.md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${section}-template.md`; a.click()
    URL.revokeObjectURL(url)
    toast.success("Template downloaded")
  }

  async function loadTemplate(section: string) {
    const input = document.createElement("input")
    input.type = "file"; input.accept = ".md,.qmd,.txt"
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return
      setLoadingTemplate(true)
      try {
        const text = await file.text()
        if (section === "lesson-plan") {
          setContent((prev) => ({ ...prev, lesson_plan: [{ phase: "From Template", timing: "—", activity: text }] }))
        } else if (section === "worksheet") {
          setContent((prev) => ({ ...prev, worksheet: [{ level: "Template", questions: [{ question: text, points: 0 }] }] }))
        } else if (section === "pre-class") {
          setContent((prev) => ({ ...prev, pre_class: { video: text, simulation: "", quiz: [] } }))
        } else if (section === "lab") {
          setContent((prev) => ({ ...prev, lab_logistics: [{ item: text, quantity: 0, notes: "" }] }))
        } else if (section === "wa-blast") {
          setContent((prev) => ({ ...prev, wa_blast: text }))
        } else if (section === "answers") {
          setContent((prev) => ({ ...prev, answer_keys: [{ question: "Template", answer: text, explanation: "" }] }))
        }
        toast.success("Template loaded!")
      } catch { toast.error("Failed to load") }
      finally { setLoadingTemplate(false) }
    }
    input.click()
  }

  function extractPhases(lp: unknown): LessonPhase[] {
    if (Array.isArray(lp) && lp.length > 0 && "phase" in lp[0]) return lp
    if (lp && typeof lp === "object") {
      const obj = lp as Record<string, unknown>
      if (Array.isArray(obj.phases)) return obj.phases.map((p: Record<string, unknown>) => ({
        phase: (p.phase ?? "") as string,
        timing: `${p.minutes ?? "?"} min`,
        activity: (p.activity ?? "") as string,
      }))
    }
    return defaultContent.lesson_plan
  }

  function extractLevels(ws: unknown): WorksheetLevel[] {
    if (Array.isArray(ws) && ws.length > 0 && "level" in ws[0]) return ws
    if (ws && typeof ws === "object") {
      const obj = ws as Record<string, unknown>
      if (Array.isArray(obj.levels)) return obj.levels.map((l: Record<string, unknown>) => ({
        level: `${l.level ?? ""}`,
        questions: ((l.questions ?? []) as Array<Record<string, unknown>>).map((q) => ({
          question: (q.question ?? "") as string,
          points: (q.points ?? (q.mark_scheme ? 1 : 1)) as number,
        })),
      }))
    }
    return defaultContent.worksheet
  }

  function extractPreClass(pc: unknown): PreClass {
    if (pc && typeof pc === "object" && "video" in (pc as Record<string, unknown>)) return pc as PreClass
    if (pc && typeof pc === "object") {
      const obj = pc as Record<string, unknown>
      const quiz = obj.entry_ticket_quiz as Record<string, unknown> | undefined
      return {
        video: (obj.video_resource as Record<string, unknown> ?? {}).title as string ?? "",
        simulation: (obj.interactive_simulation as Record<string, unknown> ?? {}).title as string ?? "",
        quiz: Array.isArray(quiz?.questions) ? quiz.questions.map((q: Record<string, unknown>) => ({
          question: (q.question ?? "") as string,
          options: (q.options ?? []) as string[],
          answer: (q.options as string[])?.[q.correct as number] ?? "",
        })) : defaultContent.pre_class.quiz,
      }
    }
    return defaultContent.pre_class
  }

  function extractLabItems(ll: unknown): LabItem[] {
    if (Array.isArray(ll) && ll.length > 0 && "item" in ll[0]) return ll
    if (ll && typeof ll === "object") {
      const obj = ll as Record<string, unknown>
      if (Array.isArray(obj.equipment_list)) return obj.equipment_list.map((e: Record<string, unknown>) => ({
        item: (e.item ?? "") as string,
        quantity: (e.quantity ?? 1) as number,
        notes: e.status as string ?? "",
      }))
    }
    return defaultContent.lab_logistics
  }

  function extractAnswerKeys(ak: unknown): AnswerKey[] {
    if (Array.isArray(ak)) return ak as AnswerKey[]
    return defaultContent.answer_keys
  }

  useEffect(() => {
    if (pkg) {
      setContent({
        lesson_plan: extractPhases(pkg.lesson_plan),
        worksheet: extractLevels(pkg.worksheet),
        pre_class: extractPreClass(pkg.pre_class),
        lab_logistics: extractLabItems(pkg.lab_logistics),
        wa_blast: (pkg.wa_blast as string) ?? "",
        answer_keys: extractAnswerKeys(pkg.answer_keys),
      })
    }
  }, [pkg])

  async function handleSave() {
    if (!pkg) return
    try {
      await updatePackage({ id: pkg.id, ...content })
      toast.success("Package updated!")
      router.push(`/grades/${grade}/${week}`)
    } catch {
      toast.error("Failed to save.")
    }
  }

  function updateLessonPlan(index: number, field: keyof LessonPhase, value: string) {
    setContent((prev) => {
      const updated = [...prev.lesson_plan]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, lesson_plan: updated }
    })
  }

  function addLessonPhase() {
    setContent((prev) => ({
      ...prev,
      lesson_plan: [...prev.lesson_plan, { phase: "", timing: "", activity: "" }],
    }))
  }

  function removeLessonPhase(index: number) {
    setContent((prev) => ({
      ...prev,
      lesson_plan: prev.lesson_plan.filter((_, i) => i !== index),
    }))
  }

  function updateWorksheetQuestion(levelIndex: number, questionIndex: number, field: string, value: string | number) {
    setContent((prev) => {
      const updatedLevels = [...prev.worksheet]
      const questions = [...updatedLevels[levelIndex].questions]
      questions[questionIndex] = { ...questions[questionIndex], [field]: value }
      updatedLevels[levelIndex] = { ...updatedLevels[levelIndex], questions }
      return { ...prev, worksheet: updatedLevels }
    })
  }

  function addWorksheetLevel() {
    setContent((prev) => ({
      ...prev,
      worksheet: [...prev.worksheet, { level: "basic", questions: [{ question: "", points: 1 }] }],
    }))
  }

  function addWorksheetQuestion(levelIndex: number) {
    setContent((prev) => {
      const updated = [...prev.worksheet]
      updated[levelIndex] = {
        ...updated[levelIndex],
        questions: [...updated[levelIndex].questions, { question: "", points: 1 }],
      }
      return { ...prev, worksheet: updated }
    })
  }

  function updateQuizQuestion(index: number, field: string, value: string | string[]) {
    setContent((prev) => {
      const updated = [...prev.pre_class.quiz]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, pre_class: { ...prev.pre_class, quiz: updated } }
    })
  }

  function addQuizQuestion() {
    setContent((prev) => ({
      ...prev,
      pre_class: {
        ...prev.pre_class,
        quiz: [...prev.pre_class.quiz, { question: "", options: ["", "", "", ""], answer: "" }],
      },
    }))
  }

  function updateLabItem(index: number, field: keyof LabItem, value: string | number) {
    setContent((prev) => {
      const updated = [...prev.lab_logistics]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, lab_logistics: updated }
    })
  }

  function addLabItem() {
    setContent((prev) => ({
      ...prev,
      lab_logistics: [...prev.lab_logistics, { item: "", quantity: 1, notes: "" }],
    }))
  }

  function updateAnswerKey(index: number, field: keyof AnswerKey, value: string) {
    setContent((prev) => {
      const updated = [...prev.answer_keys]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, answer_keys: updated }
    })
  }

  function addAnswerKey() {
    setContent((prev) => ({
      ...prev,
      answer_keys: [...prev.answer_keys, { question: "", answer: "", explanation: "" }],
    }))
  }

  if (!pkg) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/grades/${grade}/${week}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Cancel
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Week {week}</h1>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="mr-1 h-4 w-4" />
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="lesson-plan">Lesson Plan</TabsTrigger>
          <TabsTrigger value="worksheet">Worksheet</TabsTrigger>
          <TabsTrigger value="pre-class">Pre-Class</TabsTrigger>
          <TabsTrigger value="lab">Lab Logistics</TabsTrigger>
          <TabsTrigger value="wa-blast">WA Blast</TabsTrigger>
          <TabsTrigger value="answers">Answer Keys</TabsTrigger>
        </TabsList>

        <TabsContent value="lesson-plan">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lesson Plan</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("lesson-plan")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("lesson-plan")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.lesson_plan.map((phase, i) => (
                <div key={i} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phase {i + 1}</span>
                    {content.lesson_plan.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeLessonPhase(i)}>Remove</Button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Phase Name</Label>
                      <Input value={phase.phase} onChange={(e) => updateLessonPlan(i, "phase", e.target.value)} placeholder="e.g. Hook" />
                    </div>
                    <div className="space-y-1">
                      <Label>Timing</Label>
                      <Input value={phase.timing} onChange={(e) => updateLessonPlan(i, "timing", e.target.value)} placeholder="e.g. 10 min" />
                    </div>
                    <div className="space-y-1">
                      <Label>Activity</Label>
                      <Input value={phase.activity} onChange={(e) => updateLessonPlan(i, "activity", e.target.value)} placeholder="Activity description" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="worksheet">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Worksheet</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("worksheet")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("worksheet")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {content.worksheet.map((level, li) => (
                <div key={li} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>Level</Label>
                      <select
                        value={level.level}
                        onChange={(e) => {
                          const updated = [...content.worksheet]
                          updated[li] = { ...updated[li], level: e.target.value }
                          setContent((prev) => ({ ...prev, worksheet: updated }))
                        }}
                        className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addWorksheetQuestion(li)}>Add Question</Button>
                  </div>
                  {level.questions.map((q, qi) => (
                    <div key={qi} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Label>Question {qi + 1}</Label>
                        <Input value={q.question} onChange={(e) => updateWorksheetQuestion(li, qi, "question", e.target.value)} placeholder="Question text" />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label>Points</Label>
                        <Input type="number" value={q.points} onChange={(e) => updateWorksheetQuestion(li, qi, "points", Number(e.target.value))} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pre-class">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pre-Class Materials</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("pre-class")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("pre-class")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Video Link</Label>
                <Input value={content.pre_class.video} onChange={(e) => setContent((prev) => ({ ...prev, pre_class: { ...prev.pre_class, video: e.target.value } }))} placeholder="URL or description" />
              </div>
              <div className="space-y-1">
                <Label>Simulation Link</Label>
                <Input value={content.pre_class.simulation} onChange={(e) => setContent((prev) => ({ ...prev, pre_class: { ...prev.pre_class, simulation: e.target.value } }))} placeholder="URL or description" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Quiz Questions</h3>
                <Button variant="outline" size="sm" onClick={addQuizQuestion}>Add Question</Button>
              </div>
              {content.pre_class.quiz.map((q, qi) => (
                <div key={qi} className="space-y-2 rounded-lg border p-3">
                  <Label>Question {qi + 1}</Label>
                  <Input value={q.question} onChange={(e) => updateQuizQuestion(qi, "question", e.target.value)} placeholder="Question" />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{String.fromCharCode(65 + oi)}.</span>
                      <Input value={opt} onChange={(e) => {
                        const opts = [...q.options]
                        opts[oi] = e.target.value
                        updateQuizQuestion(qi, "options", opts)
                      }} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="flex-1" />
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label>Correct Answer</Label>
                    <Input value={q.answer} onChange={(e) => updateQuizQuestion(qi, "answer", e.target.value)} placeholder="Correct option text" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lab">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Equipment Checklist</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("lab")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("lab")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
              </div>
              <Button variant="outline" size="sm" onClick={addLabItem}>Add Item</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.lab_logistics.map((item, i) => (
                <div key={i} className="flex items-end gap-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <Label>Item</Label>
                    <Input value={item.item} onChange={(e) => updateLabItem(i, "item", e.target.value)} placeholder="Equipment name" />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label>Qty</Label>
                    <Input type="number" value={item.quantity} onChange={(e) => updateLabItem(i, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Notes</Label>
                    <Input value={item.notes} onChange={(e) => updateLabItem(i, "notes", e.target.value)} placeholder="Optional notes" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wa-blast">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>WA Blast Message</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("wa-blast")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("wa-blast")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Label>Message Preview</Label>
                <Textarea
                  value={content.wa_blast}
                  onChange={(e) => setContent((prev) => ({ ...prev, wa_blast: e.target.value }))}
                  placeholder="What's App blast message..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="answers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Answer Keys</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate("answers")}><FileDown className="mr-1 h-3 w-3" />Template</Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadTemplate("answers")} disabled={loadingTemplate}><Upload className="mr-1 h-3 w-3" />Load</Button>
              </div>
              <Button variant="outline" size="sm" onClick={addAnswerKey}>Add Entry</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {content.answer_keys.map((ak, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <div className="space-y-1">
                    <Label>Question</Label>
                    <Input value={ak.question} onChange={(e) => updateAnswerKey(i, "question", e.target.value)} placeholder="Question" />
                  </div>
                  <div className="space-y-1">
                    <Label>Answer</Label>
                    <Input value={ak.answer} onChange={(e) => updateAnswerKey(i, "answer", e.target.value)} placeholder="Correct answer" />
                  </div>
                  <div className="space-y-1">
                    <Label>Explanation</Label>
                    <Textarea value={ak.explanation} onChange={(e) => updateAnswerKey(i, "explanation", e.target.value)} placeholder="Explanation" rows={2} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
