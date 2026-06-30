"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wand2, FileDown, FileText, FileType, Eye, EyeOff, Loader2 } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { Separator } from "@/components/ui/separator"
import toast from "react-hot-toast"

const TOPIC_MAP: Record<number, Record<number, string>> = {
  7: { 1: "Kinematics", 2: "Kinematics", 3: "Forces", 4: "Forces", 5: "Energy", 6: "Energy", 7: "Density", 8: "Density", 9: "Pressure", 10: "Pressure" },
  8: { 1: "Kinematics", 2: "Kinematics", 3: "Forces and Motion", 4: "Forces and Motion", 5: "Energy Transfers", 6: "Energy Transfers", 7: "Work and Power", 8: "Work and Power" },
  9: { 1: "Kinematics", 2: "Kinematics", 3: "Acceleration", 4: "Acceleration", 5: "Forces", 6: "Forces", 7: "Momentum", 8: "Momentum" },
  10: { 1: "Kinematics", 2: "Kinematics", 3: "Dynamics", 4: "Dynamics", 5: "Forces", 6: "Forces", 7: "Energy", 8: "Energy" },
  11: { 1: "Kinematics", 2: "Kinematics", 3: "Dynamics", 4: "Dynamics", 5: "Forces", 6: "Forces", 7: "Work and Energy", 8: "Work and Energy" },
  12: { 1: "Thermal Physics", 2: "Thermal Physics", 3: "Ideal Gases", 4: "Ideal Gases", 5: "Oscillations", 6: "Oscillations" },
}

const CURRICULUM: Record<number, string> = { 7: "Checkpoint", 8: "Checkpoint", 9: "IGCSE", 10: "IGCSE", 11: "AS Level", 12: "A Level" }
const SYLLABUS_REF: Record<number, string> = { 7: "0893 Stage 7", 8: "0893 Stage 8/9", 9: "0625 (Half)", 10: "0625 (Full)", 11: "9702 AS", 12: "9702 A2 + TKA" }

function getDefaultForm() {
  const week = getCurrentWeek()
  return {
    grade: 10, week, year: "2026/2027", semester: "Semester 1", subject: "Physics",
    period1: "07:00", period2: "08:30", teacher: "",
    ssbat: "Students will be able to explain the fundamental concepts",
    date: "", opening: "Greeting, check attendance, pray, explain learning objectives, energizer",
    activities: "Review base concepts. Guided practice through worksheet. Group discussion.",
    closing: "Students and teacher summarise key points. Pray.",
    model: "Flipped Classroom", classwork: "", page: "",
    assessment: "Formative assessment through worksheet and class participation",
    reflection: "", resources: "",
    vp: "Christina Sri Waryanti, S.Pd.", principal: "Sisilia Juni Arianti, S.Pd., M.Pd.", unit: "Academic",
  }
}

export default function LessonPlanPage() {
  const [form, setForm] = useState(getDefaultForm())
  const [step, setStep] = useState<"form" | "result">("form")
  const [previewContent, setPreviewContent] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [loading, setLoading] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)

  const [schoolCfg, setSchoolCfg] = useState<{ vp_name: string; principal_name: string; shs_vp_name: string; shs_principal_name: string; unit: string } | null>(null)

  useEffect(() => {
    if (!configLoaded) {
      Promise.all([
        fetch("/api/settings/school").then((r) => r.json()),
        fetch("/api/profiles/me").then((r) => r.json()).catch(() => ({})),
      ]).then(([school, profile]) => {
        setSchoolCfg(school)
        if (profile?.full_name) {
          setForm((prev) => ({ ...prev, teacher: profile.full_name }))
        }
        setConfigLoaded(true)
      }).catch(() => setConfigLoaded(true))
    }
  }, [configLoaded])

  useEffect(() => {
    if (schoolCfg) {
      const isJHS = form.grade <= 9
      setForm((prev) => ({
        ...prev,
        vp: isJHS ? (schoolCfg.vp_name || prev.vp) : (schoolCfg.shs_vp_name || schoolCfg.vp_name || prev.vp),
        principal: isJHS ? (schoolCfg.principal_name || prev.principal) : (schoolCfg.shs_principal_name || schoolCfg.principal_name || prev.principal),
        unit: schoolCfg.unit || prev.unit,
      }))
    }
  }, [schoolCfg, form.grade])

  function update(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function autoFillFromGrade(grade: number, week: number) {
    const topic = TOPIC_MAP[grade]?.[week] ?? "Physics"
    const curriculum = CURRICULUM[grade] ?? "IGCSE"
    const syllabusRef = SYLLABUS_REF[grade] ?? ""
    const ssbat = `Students will be able to analyse and apply concepts related to ${topic} in accordance with the ${curriculum} curriculum.`
    const activities = `Phase 1 — Entry Ticket & Hook (5 min): Engage students with a real-world phenomenon related to ${topic}.\nPhase 2 — Productive Struggle (20 min): Guided worksheet on ${topic} in small groups.\nPhase 3 — CER Challenge (10 min): Analyse a ${topic} phenomenon, write Claim-Evidence-Reasoning.\nPhase 4 — Wrap-up (5 min): Mistake Journal and preview of next session.`
    const opening = `Greeting, check attendance, pray. Explain learning objectives for ${topic}. Present hook question to spark curiosity about ${topic}.`
    const closing = `Students summarise key concepts about ${topic}. Teacher clarifies misconceptions. Pray.`
    const assessment = `Formative assessment through Level 1-3 worksheet on ${topic} and CER challenge.`
    const resources = syllabusRef ? `${syllabusRef} — Cambridge ${curriculum} Physics` : `Cambridge ${curriculum} Physics curriculum`
    const year = new Date().getFullYear()
    const isJHS = grade <= 9
    setForm((prev) => ({
      ...prev, grade, week, year: `${year}/${year + 1}`,
      ssbat, activities, opening, closing, assessment, resources,
      vp: schoolCfg ? (isJHS ? (schoolCfg.vp_name || prev.vp) : (schoolCfg.shs_vp_name || schoolCfg.vp_name || prev.vp)) : prev.vp,
      principal: schoolCfg ? (isJHS ? (schoolCfg.principal_name || prev.principal) : (schoolCfg.shs_principal_name || schoolCfg.principal_name || prev.principal)) : prev.principal,
    }))
    toast.success(`Auto-filled for Grade ${grade}, Week ${week}: ${topic}`)
  }

  useEffect(() => {
    autoFillFromGrade(form.grade, form.week)
  }, [])

  async function handleGenerate() {
    if (!form.teacher) { toast.error("Please enter your name"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/lesson-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "md", vars: form }),
      })
      if (!res.ok) { toast.error("Generation failed"); return }
      const text = await res.text()
      setPreviewContent(text)
      setStep("result")
      setShowPreview(true)
      toast.success("Lesson plan generated!")
    } catch {
      toast.error("Generation failed")
    } finally {
      setLoading(false)
    }
  }

  async function download(format: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/lesson-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, vars: form }),
      })
      if (!res.ok) { toast.error("Download failed"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const ext = format === "docx" ? "docx" : format
      a.href = url; a.download = `lesson-plan-G${form.grade}-W${form.week}.${ext}`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded as ${format.toUpperCase()}`)
    } catch {
      toast.error("Download failed")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setStep("form")
    setShowPreview(false)
    setPreviewContent("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lesson Plan Generator</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the template variables, click generate, then preview and download your SHB lesson plan
          </p>
        </div>
        {step === "result" && (
          <Button variant="outline" size="sm" onClick={resetForm}>Back to Editor</Button>
        )}
      </div>

      {step === "form" ? (
        <Card>
          <CardHeader>
            <CardTitle>Template Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Lesson Content</TabsTrigger>
                <TabsTrigger value="admin">Administration</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Grade</Label>
                    <select value={form.grade} onChange={(e) => { const g = Number(e.target.value); update("grade", g); autoFillFromGrade(g, form.week) }}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Week</Label>
                    <Input type="number" value={form.week} onChange={(e) => { const w = Number(e.target.value); update("week", w); autoFillFromGrade(form.grade, w) }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Year</Label>
                    <Input value={form.year} onChange={(e) => update("year", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Semester</Label>
                    <Input value={form.semester} onChange={(e) => update("semester", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Subject</Label>
                    <Input value={form.subject} onChange={(e) => update("subject", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Teacher Name *</Label>
                    <Input value={form.teacher} onChange={(e) => update("teacher", e.target.value)} placeholder="Your name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Period 1</Label>
                    <Input value={form.period1} onChange={(e) => update("period1", e.target.value)} placeholder="07:00" />
                  </div>
                  <div className="space-y-1">
                    <Label>Period 2</Label>
                    <Input value={form.period2} onChange={(e) => update("period2", e.target.value)} placeholder="08:30" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>SSBAT (Goals — Students will be able to)</Label>
                  <Textarea value={form.ssbat} onChange={(e) => update("ssbat", e.target.value)} rows={2} />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="space-y-1">
                  <Label>Opening Activities</Label>
                  <Textarea value={form.opening} onChange={(e) => update("opening", e.target.value)} rows={3} />
                </div>
                <div className="space-y-1">
                  <Label>Main Activities</Label>
                  <Textarea value={form.activities} onChange={(e) => update("activities", e.target.value)} rows={5} />
                </div>
                <div className="space-y-1">
                  <Label>Closing Activities</Label>
                  <Textarea value={form.closing} onChange={(e) => update("closing", e.target.value)} rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Learning Model</Label>
                    <Input value={form.model} onChange={(e) => update("model", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Page Reference</Label>
                    <Input value={form.page} onChange={(e) => update("page", e.target.value)} placeholder="e.g. 10-15" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Classwork</Label>
                  <Textarea value={form.classwork} onChange={(e) => update("classwork", e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Assessment</Label>
                  <Textarea value={form.assessment} onChange={(e) => update("assessment", e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Reflection</Label>
                  <Textarea value={form.reflection} onChange={(e) => update("reflection", e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Resources / References</Label>
                  <Textarea value={form.resources} onChange={(e) => update("resources", e.target.value)} rows={2} />
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-1">
                  <Label>VP Name (Checked by)</Label>
                  <Input value={form.vp} onChange={(e) => update("vp", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Principal Name (Approved by)</Label>
                  <Input value={form.principal} onChange={(e) => update("principal", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={(e) => update("unit", e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />

            <div className="flex justify-center">
              <Button size="lg" onClick={handleGenerate} disabled={loading} className="gap-2 px-8">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Wand2 className="h-5 w-5" />}
                {loading ? "Generating..." : "Generate Lesson Plan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {showPreview && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Preview — Grade {form.grade}, Week {form.week}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <EyeOff className="mr-1 h-3 w-3" /> Hide
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[70vh] overflow-auto rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap leading-relaxed">
                  {previewContent}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Download Lesson Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Your lesson plan for Grade {form.grade}, Week {form.week} is ready. Choose a format:
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { format: "docx", icon: FileDown, label: "DOCX", desc: "Microsoft Word (official SHB template with logo)" },
                  { format: "pdf", icon: FileText, label: "PDF", desc: "Portable Document Format" },
                  { format: "md", icon: FileType, label: "MD", desc: "Markdown (editable)" },
                  { format: "qmd", icon: FileType, label: "QMD", desc: "Quarto Markdown (PDF-ready)" },
                ].map(({ format, icon: Icon, label, desc }) => (
                  <Button key={format} variant="outline" className="flex-col gap-1 h-auto py-4" onClick={() => download(format)} disabled={loading}>
                    <Icon className="h-6 w-6" />
                    <span className="font-medium">{label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{desc}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
