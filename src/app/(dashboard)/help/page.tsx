"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, BookOpen, BrainCircuit, ClipboardList, FileDown, FileText, FlaskConical, Calendar, BarChart3, Settings, Key, Wand2, Save, Download, Eye, CheckCircle, Send, FileSpreadsheet, FileType, Lightbulb, Target, Layers, Star, ArrowRight, Edit, Users } from "lucide-react"

const steps = [
  { icon: BookOpen, label: "Select Topic", desc: "Choose grade, week, and topic" },
  { icon: Lightbulb, label: "Add Content", desc: "Opening ideas, questions, problems" },
  { icon: Wand2, label: "AI Fill / Manual", desc: "Auto-generate or type manually" },
  { icon: FileDown, label: "Download", desc: "DOCX, PDF, MD, or QMD" },
  { icon: Send, label: "Generate Pkg", desc: "Create full weekly package" },
]

const studentSteps = [
  { icon: BookOpen, label: "Pre-Class", desc: "Watch video, do guided notes, take entry quiz" },
  { icon: BrainCircuit, label: "In-Class", desc: "Worksheet, CER challenge, lab" },
  { icon: Edit, label: "Mistake Journal", desc: "Reflect on errors each lesson" },
  { icon: FileDown, label: "Download", desc: "Get materials in PDF or DOCX" },
]

function StepCard({ icon: Icon, label, desc }: { icon: any; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quick Start Guide</h1>
        <p className="text-sm text-muted-foreground">Everything teachers and students can do in Physics Command Center</p>
      </div>

      <Tabs defaultValue="teacher">
        <TabsList className="w-full">
          <TabsTrigger value="teacher" className="flex-1">
            <GraduationCap className="mr-2 h-4 w-4" />
            For Teachers
          </TabsTrigger>
          <TabsTrigger value="student" className="flex-1">
            <Star className="mr-2 h-4 w-4" />
            For Students
          </TabsTrigger>
        </TabsList>

        {/* ========== TEACHER TAB ========== */}
        <TabsContent value="teacher" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4" />
                What Can Teachers Do?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StepCard icon={ClipboardList} label="Plan Syllabus" desc="Select topics per grade/week, add opening ideas, questions, and problems" />
              <StepCard icon={Wand2} label="AI-Assisted Content" desc="Click 'AI Fill' to auto-generate opening hooks and questions from your topic" />
              <StepCard icon={BrainCircuit} label="Generate Weekly Package" desc="One-click to create full lesson plan, worksheet, pre-class, lab logistics, WA blast" />
              <StepCard icon={FileSpreadsheet} label="Download Lesson Plan" desc="SHB official template in DOCX, or export as PDF, MD, QMD" />
              <StepCard icon={CheckCircle} label="Approve & Publish" desc="Review generated packages, approve, then publish for students" />
              <StepCard icon={BookOpen} label="Track Class Memory" desc="Log misconceptions, struggling students, notes for next week" />
              <StepCard icon={FlaskConical} label="Manage Lab Inventory" desc="CRUD equipment, track stock, assign to practical sessions" />
              <StepCard icon={Calendar} label="Manage Calendar" desc="Add/Edit/Delete academic events, holidays, exams per grade" />
              <StepCard icon={BarChart3} label="Analytics" desc="View student performance, accuracy trends, journal entries" />
              <StepCard icon={Settings} label="Configure School" desc="Set VP & Principal names per level (JHS/SHS) — auto-fills in templates" />
              <StepCard icon={Key} label="AI Providers" desc="Add API keys for OpenAI, Groq, Gemini, or OpenCode AI" />
              <StepCard icon={Users} label="Manage Users" desc="Invite teachers, students, lab assistants; assign roles and grades" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Products Teachers Can Generate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Product</th>
                      <th className="p-2 text-left font-medium">How</th>
                      <th className="p-2 text-left font-medium">Formats</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Lesson Plan</td>
                      <td className="p-2 text-muted-foreground">/lesson-plan → Fill form → Generate</td>
                      <td className="p-2"><div className="flex gap-1 flex-wrap"><Badge variant="outline">DOCX</Badge><Badge variant="outline">PDF</Badge><Badge variant="outline">MD</Badge><Badge variant="outline">QMD</Badge></div></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Syllabus Plan</td>
                      <td className="p-2 text-muted-foreground">/syllabus → Select topics → AI Fill or manual → Download</td>
                      <td className="p-2"><div className="flex gap-1 flex-wrap"><Badge variant="outline">DOCX</Badge><Badge variant="outline">PDF</Badge><Badge variant="outline">MD</Badge><Badge variant="outline">QMD</Badge></div></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Weekly Package</td>
                      <td className="p-2 text-muted-foreground">/syllabus → Generate Pkg → Auto-creates lesson + worksheet + pre-class</td>
                      <td className="p-2"><Badge variant="outline">In-app</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Lesson Plan (from Package)</td>
                      <td className="p-2 text-muted-foreground">/grades/[grade]/[week] → Template → DOCX/PDF/MD</td>
                      <td className="p-2"><div className="flex gap-1 flex-wrap"><Badge variant="outline">DOCX</Badge><Badge variant="outline">PDF</Badge><Badge variant="outline">MD</Badge></div></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Package Export</td>
                      <td className="p-2 text-muted-foreground">/grades/[grade]/[week] → Export → MD/QMD/DOCX/PDF</td>
                      <td className="p-2"><div className="flex gap-1 flex-wrap"><Badge variant="outline">DOCX</Badge><Badge variant="outline">PDF</Badge><Badge variant="outline">MD</Badge><Badge variant="outline">QMD</Badge></div></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Class Memory Report</td>
                      <td className="p-2 text-muted-foreground">/memory → Add entries per grade/week</td>
                      <td className="p-2"><Badge variant="outline">In-app</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Analytics Report</td>
                      <td className="p-2 text-muted-foreground">/analytics → View by grade</td>
                      <td className="p-2"><Badge variant="outline">In-app</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4" />
                Quick Start: Generate a Lesson Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: "1", title: "Go to Lesson Plan", desc: "Click Lesson Plan in the sidebar or visit /lesson-plan" },
                { step: "2", title: "Select Grade & Week", desc: "All fields auto-fill based on the topic for that grade/week" },
                { step: "3", title: "Edit as Needed", desc: "Customise the opening, activities, closing, assessment, or administration fields" },
                { step: "4", title: "Click Generate", desc: "The system fills the SHB template and shows a preview" },
                { step: "5", title: "Download", desc: "Choose DOCX (official template with logo), PDF (landscape), MD, or QMD" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Send className="h-4 w-4" />
                Quick Start: Generate a Weekly Package (Full Automation)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: "1", title: "Go to Syllabus", desc: "Click Syllabus in the sidebar" },
                { step: "2", title: "Select Grade, Week & Topics", desc: "Check the topics you want to cover" },
                { step: "3", title: "Click AI Fill (optional)", desc: "Auto-generate opening ideas and questions from your topic" },
                { step: "4", title: "Click Generate Pkg", desc: "The AI agent creates: Lesson Plan, Worksheet (3 levels), Pre-Class (video+simulation+quiz), Lab Logistics, WA Blast" },
                { step: "5", title: "Review & Approve", desc: "Go to Grades → detail page → Approve → Publish" },
                { step: "6", title: "Export or Download", desc: "Use Export (DOCX/PDF/MD/QMD) or Template (SHB lesson plan format)" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== STUDENT TAB ========== */}
        <TabsContent value="student" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" />
                What Can Students Do?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <StepCard icon={BookOpen} label="View Pre-Class Materials" desc="Watch videos, use simulations, complete guided notes before class" />
              <StepCard icon={ClipboardList} label="Take Entry Ticket Quiz" desc="Answer 3 MCQ questions before each lesson — minimum 2/3 to join lab" />
              <StepCard icon={BrainCircuit} label="Do CER Challenge" desc="Write Claim-Evidence-Reasoning for real physics phenomena" />
              <StepCard icon={Edit} label="Write Mistake Journal" desc="Reflect on errors after each lesson — private digital journal" />
              <StepCard icon={FileDown} label="Download Materials" desc="Download worksheets, lesson plans, and lab sheets in PDF or DOCX" />
              <StepCard icon={Eye} label="View Weekly Package" desc="See the full package published by your teacher: lesson plan, worksheet, pre-class" />
              <StepCard icon={Calendar} label="Check Calendar" desc="View academic events, holidays, exam schedules" />
              <StepCard icon={BarChart3} label="Track Progress" desc="Teachers can see your journal entries and quiz accuracy" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Products Students Can Access / Download
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Product</th>
                      <th className="p-2 text-left font-medium">Where</th>
                      <th className="p-2 text-left font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Weekly Package</td>
                      <td className="p-2 text-muted-foreground">/my-week</td>
                      <td className="p-2">View lesson plan, worksheet, pre-class, lab logistics</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Lesson Plan PDF/DOCX</td>
                      <td className="p-2 text-muted-foreground">/my-week → Template buttons</td>
                      <td className="p-2">Download DOCX, PDF, or MD</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Pre-Class Video</td>
                      <td className="p-2 text-muted-foreground">/pre-class</td>
                      <td className="p-2">Watch, do guided notes, take entry quiz</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Mistake Journal</td>
                      <td className="p-2 text-muted-foreground">/my-journal</td>
                      <td className="p-2">Write, edit, review your own entries</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Calendar</td>
                      <td className="p-2 text-muted-foreground">/calendar</td>
                      <td className="p-2">View events, holidays, exams</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4" />
                Quick Start: Pre-Class & Download
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: "1", title: "Log In", desc: "Use your SHB email — teacher assigns your grade" },
                { step: "2", title: "Go to My Week", desc: "See the published package for your grade and current week" },
                { step: "3", title: "Do Pre-Class", desc: "Go to Pre-Class → watch video → do guided notes → take entry quiz (need 2/3)" },
                { step: "4", title: "Download Materials", desc: "From My Week, click Template (DOCX/PDF/MD) to download lesson plan or worksheet" },
                { step: "5", title: "Write Mistake Journal", desc: "After each lesson, go to My Journal → write what you learned and what confused you" },
                { step: "6", title: "Track Your Progress", desc: "Teachers review your journal and quiz results to help you improve" },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{step}</div>
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                How to Download (Student)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-lg border p-4">
                <p className="font-medium mb-2">From My Week page:</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Go to <strong>/my-week</strong></li>
                  <li>Click <strong>Template</strong> → choose <Badge variant="outline" className="text-xs">DOCX</Badge> (Word) or <Badge variant="outline" className="text-xs">PDF</Badge> or <Badge variant="outline" className="text-xs">MD</Badge></li>
                  <li>The file downloads automatically — open in Word, browser, or any text editor</li>
                </ol>
              </div>
              <div className="rounded-lg border p-4">
                <p className="font-medium mb-2">From Pre-Class page:</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  <li>Go to <strong>/pre-class</strong></li>
                  <li>Watch the video, use the simulation, complete guided notes</li>
                  <li>Take the <strong>Entry Ticket Quiz</strong> — must score 2/3 to join lab</li>
                </ol>
              </div>
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="font-medium text-xs text-muted-foreground">💡 Tip: All downloads use the official SHB lesson plan template with school logo. PDFs are in landscape format, ready to print.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
