"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePackages, useApprovePackage, usePublishPackage, useUpdatePackage } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle, Send, Edit, FileDown, FileText, FileType, FileSpreadsheet, Download, Printer, Pencil } from "lucide-react"
import { marked } from "marked"
import MediaSection from "@/components/media/MediaSection"
import Link from "next/link"
import toast from "react-hot-toast"

export default function PackageDetailPage() {
  const params = useParams()
  const router = useRouter()
  const grade = Number(params.grade)
  const week = Number(params.week)
  const slug = (params as any)?.slug as string | undefined
  const { data: packages, isLoading } = usePackages({ grade, week })
  const pkg = packages?.[0]
  const { isSuperAdmin, isTeacher } = useRBAC()
  const { mutateAsync: approvePackage } = useApprovePackage()
  const { mutateAsync: publishPackage } = usePublishPackage()
  const { mutateAsync: updatePackage } = useUpdatePackage()
  const [activeTab, setActiveTab] = useState("lesson-plan")
  const [exportOpen, setExportOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editContent, setEditContent] = useState<string>("")
  const [editTitle, setEditTitle] = useState<string>("")
  const todayStr = new Date().toISOString().split("T")[0]

  function MarkdownRender({ content }: { content: string }) {
    if (!content) return null
    try {
      const html = marked.parse(content, { breaks: true }) as string
      return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    } catch {
      return <pre className="whitespace-pre-wrap text-sm">{content}</pre>
    }
  }
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    if (exportOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [exportOpen])

  function startEdit(section: string) {
    let content = ""
    const labels: Record<string, string> = { "lesson-plan": "Lesson Plan", worksheet: "Worksheet", "pre-class": "Pre-Class Materials", lab: "Lab Logistics", "wa-blast": "WA Blast", answers: "Answer Keys" }
    if (section === "lesson-plan") content = lessonPlan.map((p) => `## ${p.phase} (${p.timing})\n\n${p.activity}`).join("\n\n")
    else if (section === "worksheet") content = worksheet.map((l) => `### ${l.level} Level\n\n${l.questions.map((q) => `Q: ${q.question}`).join("\n")}`).join("\n\n")
    else if (section === "pre-class") content = `Video: ${preClass.video}\nSimulation: ${preClass.simulation}\nQuiz: ${preClass.quiz?.map((q) => q.question).join("\n")}`
    else if (section === "lab") content = labLogistics.map((l) => `${l.item} x${l.quantity} — ${l.notes}`).join("\n")
    else if (section === "wa-blast") content = waBlast
    else if (section === "answers") content = answerKeys.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")
    setEditContent(content)
    setEditTitle(labels[section] ?? section)
    setEditingSection(section)
  }

  async function saveEdit() {
    if (!pkg || !editingSection) return
    const field = editingSection === "lab" ? "lab_logistics" : editingSection === "answers" ? "answer_keys" : editingSection
    const updates: Record<string, unknown> = {}

    if (editingSection === "wa-blast") {
      updates.wa_blast = editContent
    } else if (["lesson-plan", "worksheet", "pre-class", "lab", "answers"].includes(editingSection)) {
      // Store markdown as JSON for JSONB columns
      updates[field] = { _md: editContent }
    }

    try {
      await updatePackage({ id: pkg.id, ...updates })
      toast.success(`${editTitle} updated!`)
      setEditingSection(null)
    } catch (e) {
      toast.error("Failed to save: " + (e instanceof Error ? e.message : "Unknown"))
    }
  }

  function handlePrint() {
    // Add a print-only stylesheet to the main page
    const style = document.createElement("style")
    style.id = "print-style"
    style.textContent = `
      @media print {
        body * { visibility: hidden; }
        #tab-content-${activeTab}, #tab-content-${activeTab} * { visibility: visible; }
        #tab-content-${activeTab} { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => document.getElementById("print-style")?.remove(), 1000)
  }

  async function handleApprove() {
    if (!pkg) return
    try {
      await approvePackage(pkg.id)
      toast.success("Package approved!")
    } catch {
      toast.error("Failed to approve.")
    }
  }

  async function handlePublish() {
    if (!pkg) return
    try {
      await publishPackage(pkg.id)
      toast.success("Package published!")
    } catch {
      toast.error("Failed to publish.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <p className="text-center text-muted-foreground">Package not found.</p>
      </div>
    )
  }

  const lessonPlan = (() => {
    const lp = pkg?.lesson_plan
    if (Array.isArray(lp)) return lp as Array<{ phase: string; timing: string; activity: string }>
    if (lp && typeof lp === "object") {
      const obj = lp as Record<string, unknown>
      // Custom markdown content
      if (obj._md) return [{ phase: "Custom Content", timing: "—", activity: obj._md as string }] as Array<{ phase: string; timing: string; activity: string }>
      if (Array.isArray(obj.phases)) return (obj.phases as Array<Record<string, unknown>>).map((p) => ({
        phase: (p.phase ?? "") as string,
        timing: `${p.minutes ?? "?"} min`,
        activity: (p.activity ?? "") as string,
      }))
    }
    return []
  })()
  const worksheet = (() => {
    const ws = pkg?.worksheet
    if (Array.isArray(ws)) return ws as Array<{ level: string; questions: Array<{ question: string; points: number }> }>
    if (ws && typeof ws === "object") {
      const obj = ws as Record<string, unknown>
      if (obj._md) return [{ level: "Custom", questions: [{ question: obj._md as string, points: 0 }] }] as Array<{ level: string; questions: Array<{ question: string; points: number }> }>
      if (Array.isArray(obj.levels)) return (obj.levels as Array<Record<string, unknown>>).map((l) => ({
        level: `${l.level ?? ""}`,
        questions: ((l.questions ?? []) as Array<Record<string, unknown>>).map((q) => ({
          question: (q.question ?? "") as string,
          points: (q.points ?? (q.mark_scheme ? 1 : 1)) as number,
        })),
      }))
    }
    return []
  })()
  const preClass = (() => {
    const pc = pkg?.pre_class
    if (pc && typeof pc === "object") {
      const obj = pc as Record<string, unknown>
      if (obj._md) return { video: obj._md as string, simulation: "", quiz: [] }
    }
    if (pc && typeof pc === "object" && "video" in (pc as Record<string, unknown>)) return pc as { video?: string; simulation?: string; quiz?: Array<{ question: string; options: string[]; answer: string }> }
    if (pc && typeof pc === "object") {
      const obj = pc as Record<string, unknown>
      const quiz = obj.entry_ticket_quiz as Record<string, unknown> | undefined
      return {
        video: (obj.video_resource as Record<string, unknown> ?? {}).title as string ?? "",
        simulation: (obj.interactive_simulation as Record<string, unknown> ?? {}).title as string ?? "",
        quiz: Array.isArray(quiz?.questions) ? (quiz.questions as Array<Record<string, unknown>>).map((q) => ({
          question: (q.question ?? "") as string,
          options: (q.options ?? []) as string[],
          answer: (q.options as string[])?.[q.correct as number] ?? "",
        })) : [],
      }
    }
    return {}
  })()
  const labLogistics = (() => {
    const ll = pkg?.lab_logistics
    if (Array.isArray(ll)) return ll as Array<{ item: string; quantity: number; notes: string }>
    if (ll && typeof ll === "object") {
      const obj = ll as Record<string, unknown>
      if (obj._md) return [{ item: obj._md as string, quantity: 0, notes: "" }]
      if (Array.isArray(obj.equipment_list)) return (obj.equipment_list as Array<Record<string, unknown>>).map((e) => ({
        item: (e.item ?? "") as string,
        quantity: (e.quantity ?? 1) as number,
        notes: (e.status as string) ?? "",
      }))
    }
    return []
  })()
  const waBlast = (pkg?.wa_blast as string) ?? ""
  const answerKeys = (() => {
    const ak = pkg?.answer_keys
    if (ak && typeof ak === "object" && !Array.isArray(ak) && (ak as Record<string, unknown>)._md) {
      return [{ question: "Custom Content", answer: (ak as Record<string, unknown>)._md as string, explanation: "" }]
    }
    if (Array.isArray(ak) && ak.length > 0) return ak as Array<{ question: string; answer: string; explanation: string }>
    // Fallback: extract from worksheet Level 3 (CER) model_answer fields
    const ws = pkg?.worksheet as Record<string, unknown> | undefined
    const levels = (ws?.levels as Array<Record<string, unknown>>) ?? []
    const extracted: Array<{ question: string; answer: string; explanation: string }> = []
    levels.forEach((l) => {
      const qs = (l.questions as Array<Record<string, unknown>>) ?? []
      qs.forEach((q) => {
        const qText = (q.question as string) ?? ""
        const modelAns = (q.model_answer as string) ?? ""
        const markScheme = (q.mark_scheme as string) ?? ""
        const explanation = (q.explanation as string) ?? ""
        if (modelAns || markScheme) {
          extracted.push({
            question: qText.length > 80 ? qText.slice(0, 80) + "…" : qText,
            answer: modelAns || markScheme || "See mark scheme",
            explanation: explanation || (q.correct ? `Correct: ${q.correct}` : ""),
          })
        }
      })
    })
    return extracted.length ? extracted : []
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/grades/${grade}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Grade {grade}
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Week {week}: {pkg.title}
          </h1>
          {!slug && pkg.title && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Slug: <code className="text-primary">/grades/{grade}/{week}/{pkg.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</code>
              <button className="ml-2 text-primary hover:underline text-xs" onClick={() => {
                const s = pkg.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ?? ""
                navigator.clipboard.writeText(`${window.location.origin}/grades/${grade}/${week}/${s}`)
                toast.success("Slug URL copied!")
              }}>Copy</button>
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">Grade {grade}</Badge>
            <Badge
              variant={
                pkg.status === "published"
                  ? "default"
                  : pkg.status === "approved"
                    ? "secondary"
                    : pkg.status === "pending_review"
                      ? "outline"
                      : "outline"
              }
            >
              {pkg.status === "pending_review" ? "Pending Review" : pkg.status}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/grades/${grade}/${week}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {/* Tab-aware download: exports the full package content per format */}
          {(["docx", "pdf", "md"] as const).map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={async () => {
              try {
                const res = await fetch(`/api/packages/${pkg.id}/export?format=${fmt}`)
                if (!res.ok) { toast.error("Download failed"); return }
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                const tab = activeTab === "lesson-plan" ? "lesson-plan" : activeTab === "wa-blast" ? "wa-blast" : activeTab === "answers" ? "answer-keys" : activeTab
                a.href = url; a.download = `${tab}-G${grade}-W${week}-${todayStr}.${fmt === "docx" ? "docx" : fmt}`; a.click()
                URL.revokeObjectURL(url)
                toast.success(`${fmt.toUpperCase()} downloaded!`)
              } catch { toast.error("Download failed") }
            }}>
              {fmt === "docx" ? <FileSpreadsheet className="mr-1 h-3 w-3" /> : fmt === "pdf" ? <FileText className="mr-1 h-3 w-3" /> : <FileType className="mr-1 h-3 w-3" />}
              {fmt.toUpperCase()}
            </Button>
          ))}
          <Button variant="default" size="sm" onClick={async () => {
            toast.success("Downloading all formats...")
            const fmts = ["docx", "pdf", "md"]
            for (const fmt of fmts) {
              try {
                const res = await fetch(`/api/packages/${pkg.id}/export?format=${fmt}`)
                if (!res.ok) continue
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url; a.download = `${activeTab === "wa-blast" ? "wa-blast" : activeTab === "answers" ? "answer-keys" : activeTab}-G${grade}-W${week}-${todayStr}.${fmt === "docx" ? "docx" : fmt}`; a.click()
                URL.revokeObjectURL(url)
                await new Promise(r => setTimeout(r, 500))
              } catch {}
            }
            toast.success("All formats downloaded!")
          }}>
            <Download className="mr-1 h-3 w-3" />All
          </Button>
          <div className="relative" ref={exportRef}>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(!exportOpen)}>
              <FileDown className="mr-1 h-4 w-4" />
              More
            </Button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border bg-background p-1 shadow-lg">
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b mb-1">Full Package</div>
                {(["docx", "pdf", "md", "qmd"] as const).map((fmt) => (
                  <button key={fmt} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={async () => {
                      setExportOpen(false)
                      try {
                        const res = await fetch(`/api/packages/${pkg.id}/export?format=${fmt}`)
                        if (!res.ok) { toast.error("Export failed"); return }
                        const blob = await res.blob(); const url = URL.createObjectURL(blob)
                        const a = document.createElement("a"); a.href = url; a.download = `grade-${grade}-week-${week}-${todayStr}.${fmt}`; a.click()
                        URL.revokeObjectURL(url); toast.success(`Exported as ${fmt.toUpperCase()}`)
                      } catch { toast.error("Export failed") }
                    }}
                  >
                    {fmt === "docx" ? <FileDown className="h-4 w-4" /> : fmt === "pdf" ? <FileText className="h-4 w-4" /> : <FileType className="h-4 w-4" />}
                    {fmt.toUpperCase()}
                  </button>
                ))}
                <div className="border-t mt-1 pt-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Lesson Plan Template</div>
                  {(["docx", "pdf", "md"] as const).map((fmt) => (
                    <button key={`tpl-${fmt}`} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={async () => {
                        setExportOpen(false)
                        try {
                          const res = await fetch(`/api/packages/${pkg.id}/lesson-plan-template?format=${fmt}`)
                          if (!res.ok) return
                          const blob = await res.blob(); const url = URL.createObjectURL(blob)
                          const a = document.createElement("a"); a.href = url; a.download = `lesson-plan-template-G${grade}-W${week}-${todayStr}.${fmt}`; a.click()
                          URL.revokeObjectURL(url); toast.success(`Template ${fmt.toUpperCase()}`)
                        } catch {}
                      }}
                    >
                      {fmt === "docx" ? <FileSpreadsheet className="h-4 w-4" /> : fmt === "pdf" ? <FileText className="h-4 w-4" /> : <FileType className="h-4 w-4" />}
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {isSuperAdmin && pkg.status !== "published" && (
            <>
              {(pkg.status === "draft" || pkg.status === "pending_review") && (
                <Button size="sm" onClick={handleApprove}>
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
              )}
              {pkg.status === "approved" && (
                <Button size="sm" onClick={handlePublish}>
                  <Send className="mr-1 h-4 w-4" />
                  Publish
                </Button>
              )}
            </>
          )}
        </div>
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
          <Card id="tab-content-lesson-plan">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lesson Plan</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "lesson-plan" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("lesson-plan")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === "lesson-plan" ? (
                <textarea className="w-full min-h-[300px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : lessonPlan.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lesson plan yet.</p>
              ) : lessonPlan.length === 1 && (lessonPlan[0].phase === "Custom Content" || lessonPlan[0].phase === "From Template") ? (
                <MarkdownRender content={lessonPlan[0].activity} />
              ) : (
                <div className="space-y-4">
                  {lessonPlan.map((phase, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{phase.phase}</h3>
                        <Badge variant="outline">{phase.timing}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <MarkdownRender content={phase.activity} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {pkg && <MediaSection packageId={pkg.id} section="lesson-plan" canEdit={isSuperAdmin || isTeacher} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="worksheet">
          <Card id="tab-content-worksheet">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Worksheet</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "worksheet" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("worksheet")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === "worksheet" ? (
                <textarea className="w-full min-h-[300px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : worksheet.length === 0 ? (
                <p className="text-sm text-muted-foreground">No worksheet yet.</p>
              ) : worksheet.length === 1 && (worksheet[0].level === "Custom" || worksheet[0].level === "Template") ? (
                <MarkdownRender content={worksheet[0].questions[0]?.question ?? ""} />
              ) : (
                <div className="space-y-6">
                  {worksheet.map((level, i) => (
                    <div key={i}>
                      <h3 className="mb-2 font-semibold capitalize">{level.level} Level</h3>
                      <div className="space-y-2">
                        {level.questions.map((q, j) => (
                          <div key={j} className="rounded-lg border p-3 text-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <MarkdownRender content={`${j + 1}. ${q.question}`} />
                              </div>
                              <Badge variant="outline" className="ml-2 shrink-0">{q.points} pts</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {pkg && <MediaSection packageId={pkg.id} section="worksheet" canEdit={isSuperAdmin || isTeacher} />}
          </Card>
        </TabsContent>
        
        <TabsContent value="pre-class">
          <Card id="tab-content-pre-class">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pre-Class Materials</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "pre-class" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("pre-class")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSection === "pre-class" ? (
                <textarea className="w-full min-h-[300px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : (
                <>{preClass.video && !preClass.simulation && !preClass.quiz?.length ? (
                  <MarkdownRender content={preClass.video} />
                ) : (
                  <>{preClass.video && (
                    <div>
                      <h3 className="text-sm font-semibold">Video</h3>
                      <p className="text-sm text-muted-foreground">{preClass.video}</p>
                    </div>
                  )}
                  {preClass.simulation && (
                    <div>
                      <h3 className="text-sm font-semibold">Simulation</h3>
                      <p className="text-sm text-muted-foreground">{preClass.simulation}</p>
                    </div>
                  )}</>
                )}
                {preClass.quiz && preClass.quiz.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Entry Quiz</h3>
                    <div className="space-y-3">
                      {preClass.quiz.map((q, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="text-sm font-medium">
                            <MarkdownRender content={`${i + 1}. ${q.question}`} />
                          </div>
                          <ul className="mt-1 space-y-1">
                            {q.options.map((opt, j) => (
                              <li key={j} className="text-sm text-muted-foreground">
                                {opt}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                            Answer: {q.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!preClass.video && !preClass.simulation && (!preClass.quiz || preClass.quiz.length === 0) && (
                  <p className="text-sm text-muted-foreground">No pre-class materials yet.</p>
                )}</>
              )}
              {pkg && <MediaSection packageId={pkg.id} section="pre-class" canEdit={isSuperAdmin || isTeacher} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="lab">
          <Card id="tab-content-lab">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lab Logistics</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "lab" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("lab")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === "lab" ? (
                <textarea className="w-full min-h-[200px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : labLogistics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lab logistics yet.</p>
              ) : labLogistics.length === 1 && labLogistics[0].quantity === 0 ? (
                <MarkdownRender content={labLogistics[0].item} />
              ) : (
                <div className="space-y-2">
                  {labLogistics.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="font-medium">{item.item}</span>
                      <div className="flex items-center gap-4">
                        <span>Qty: {item.quantity}</span>
                        {item.notes && (
                          <span className="text-muted-foreground">{item.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {pkg && <MediaSection packageId={pkg.id} section="lab-logistics" canEdit={isSuperAdmin || isTeacher} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wa-blast">
          <Card id="tab-content-wa-blast">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>WA Blast Message</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "wa-blast" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("wa-blast")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === "wa-blast" ? (
                <textarea className="w-full min-h-[200px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : waBlast ? (
                <div className="rounded-lg bg-muted p-4">
                  <p className="whitespace-pre-wrap text-sm">{typeof waBlast === "string" ? waBlast : JSON.stringify(waBlast)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No WA blast message yet.</p>
              )}
              {pkg && <MediaSection packageId={pkg.id} section="wa-blast" canEdit={isSuperAdmin || isTeacher} />}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="answers">
          <Card id="tab-content-answers">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Answer Keys</CardTitle>
                <div className="flex items-center gap-1 no-print">
                  {editingSection === "answers" ? (
                    <><Button variant="default" size="sm" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" onClick={() => setEditingSection(null)}>Cancel</Button></>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => startEdit("answers")}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handlePrint}><Printer className="mr-1 h-3 w-3" />Print</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingSection === "answers" ? (
                <textarea className="w-full min-h-[200px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
              ) : answerKeys.length === 0 ? (
                <p className="text-sm text-muted-foreground">No answer keys yet.</p>
              ) : answerKeys.length === 1 && (answerKeys[0].question === "Custom Content" || answerKeys[0].question === "Template") ? (
                <MarkdownRender content={answerKeys[0].answer} />
              ) : (
                <div className="space-y-4">
                  {answerKeys.map((ak, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <p className="text-sm font-medium">{ak.question}</p>
                      <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                        Answer: {ak.answer}
                      </p>
                      {ak.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{ak.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {pkg && <MediaSection packageId={pkg.id} section="answer-keys" canEdit={isSuperAdmin || isTeacher} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
