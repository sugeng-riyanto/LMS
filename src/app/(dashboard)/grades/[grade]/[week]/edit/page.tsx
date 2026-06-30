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
import { ArrowLeft, Save } from "lucide-react"
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

  useEffect(() => {
    if (pkg?.content) {
      const existing = pkg.content as Record<string, unknown>
      setContent({
        lesson_plan: (existing.lesson_plan as LessonPhase[]) ?? defaultContent.lesson_plan,
        worksheet: (existing.worksheet as WorksheetLevel[]) ?? defaultContent.worksheet,
        pre_class: (existing.pre_class as PreClass) ?? defaultContent.pre_class,
        lab_logistics: (existing.lab_logistics as LabItem[]) ?? defaultContent.lab_logistics,
        wa_blast: (existing.wa_blast as string) ?? "",
        answer_keys: (existing.answer_keys as AnswerKey[]) ?? defaultContent.answer_keys,
      })
    }
  }, [pkg])

  async function handleSave() {
    if (!pkg) return
    try {
      await updatePackage({ id: pkg.id, content: content as unknown as Record<string, unknown> })
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lesson Phases</CardTitle>
              <Button variant="outline" size="sm" onClick={addLessonPhase}>Add Phase</Button>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Worksheet Levels</CardTitle>
              <Button variant="outline" size="sm" onClick={addWorksheetLevel}>Add Level</Button>
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
              <CardTitle>Pre-Class Materials</CardTitle>
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
              <CardTitle>Equipment Checklist</CardTitle>
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
              <CardTitle>WA Blast Message</CardTitle>
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
              <CardTitle>Answer Keys</CardTitle>
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
