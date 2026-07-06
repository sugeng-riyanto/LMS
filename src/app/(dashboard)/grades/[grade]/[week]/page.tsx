"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { usePackages, useApprovePackage, usePublishPackage, useUpdatePackage } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
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
  const { isSuperAdmin, isTeacher, isPrincipal } = useRBAC()
  const { mutateAsync: approvePackage } = useApprovePackage()

  if (!isSuperAdmin && !isTeacher && !isPrincipal) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Access denied.</div>
  }
  const { mutateAsync: publishPackage } = usePublishPackage()
  const { mutateAsync: updatePackage } = useUpdatePackage()
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
    const style = document.createElement("style")
    style.id = "print-style"
    style.textContent = `
      @media print {
        .no-print { display: none !important; }
        body { padding: 0 !important; margin: 0 !important; }
        @page { margin: 1.5cm; }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push(`/grades/${grade}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Grade {grade}
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Week {week}: {pkg.title}
          </h1>
          {!slug && pkg.title && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Slug: <code className="text-primary">/grades/{grade}/{week}/{pkg.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}</code>
              <button className="ml-2 text-primary hover:underline text-xs" onClick={() => {
                const s = pkg.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ?? ""
                navigator.clipboard.writeText(`${window.location.origin}/grades/${grade}/${week}/${s}`)
                toast.success("Slug URL copied!")
              }}>Copy</button>
            </p>
          )}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Grade {grade}</Badge>
            <Badge
              variant={
                pkg.status === "published"
                  ? "default"
                  : pkg.status === "approved"
                    ? "secondary"
                    : "outline"
              }
            >
              {pkg.status === "pending_review" ? "Pending Review" : pkg.status}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/grades/${grade}/${week}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:inline-flex">
            <Printer className="mr-1 h-3 w-3" />Print
          </Button>
          {/* Tab-aware download: exports the full package content per format */}
          <div className="hidden sm:flex items-center gap-1">
            {(["docx", "pdf", "md"] as const).map((fmt) => (
              <Button key={fmt} variant="outline" size="sm" onClick={async () => {
                try {
                  const res = await fetch(`/api/packages/${pkg.id}/export?format=${fmt}`)
                  if (!res.ok) { toast.error("Download failed"); return }
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url; a.download = `G${grade}-W${week}-${todayStr}.${fmt === "docx" ? "docx" : fmt}`; a.click()
                  URL.revokeObjectURL(url)
                  toast.success(`${fmt.toUpperCase()} downloaded!`)
                } catch { toast.error("Download failed") }
              }}>
                {fmt === "docx" ? <FileSpreadsheet className="mr-1 h-3 w-3" /> : fmt === "pdf" ? <FileText className="mr-1 h-3 w-3" /> : <FileType className="mr-1 h-3 w-3" />}
                {fmt.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="default" size="sm" className="hidden sm:inline-flex" onClick={async () => {
            toast.success("Downloading all formats...")
            const fmts = ["docx", "pdf", "md"]
            for (const fmt of fmts) {
              try {
                const res = await fetch(`/api/packages/${pkg.id}/export?format=${fmt}`)
                if (!res.ok) continue
                const blob = await res.blob()
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url; a.download = `G${grade}-W${week}-${todayStr}.${fmt === "docx" ? "docx" : fmt}`; a.click()
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
              {exportOpen ? "Close" : "Export"}
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
          {(isSuperAdmin || isTeacher) && pkg.status !== "published" && (
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

      {/* ── SINGLE-PAGE DOCUMENT LAYOUT ── */}
      <div className="space-y-10 print:space-y-6">

        {/* 1. LESSON PLAN */}
        <SectionCard number={1} title="Lesson Plan" section="lesson-plan" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {lessonPlan.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lesson plan yet.</p>
          ) : lessonPlan.length === 1 && (lessonPlan[0].phase === "Custom Content" || lessonPlan[0].phase === "From Template") ? (
            <MarkdownRender content={lessonPlan[0].activity} />
          ) : (
            <div className="space-y-4">
              {lessonPlan.map((phase, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{phase.phase}</h3>
                    <Badge variant="outline" className="text-xs">{phase.timing}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <MarkdownRender content={phase.activity} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="lesson-plan" canEdit={isSuperAdmin || isTeacher} />}

        {/* 2. WORKSHEET */}
        <SectionCard number={2} title="Worksheet" section="worksheet" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {worksheet.length === 0 ? (
            <p className="text-sm text-muted-foreground">No worksheet yet.</p>
          ) : worksheet.length === 1 && (worksheet[0].level === "Custom" || worksheet[0].level === "Template") ? (
            <MarkdownRender content={worksheet[0].questions[0]?.question ?? ""} />
          ) : (
            <div className="space-y-6">
              {worksheet.map((level, i) => (
                <div key={i}>
                  <h3 className="mb-2 text-sm font-semibold capitalize">{level.level} Level</h3>
                  <div className="space-y-2">
                    {level.questions.map((q, j) => (
                      <div key={j} className="rounded-lg border p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <MarkdownRender content={`${j + 1}. ${q.question}`} />
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">{q.points} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="worksheet" canEdit={isSuperAdmin || isTeacher} />}

        {/* 3. PRE-CLASS MATERIALS */}
        <SectionCard number={3} title="Pre-Class Materials" section="pre-class" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {(() => {
            if (editingSection === "pre-class") return (
              <textarea className="w-full min-h-[300px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            )
            const hasContent = preClass.video || preClass.simulation || (preClass.quiz && preClass.quiz.length > 0)
            if (!hasContent) return <p className="text-sm text-muted-foreground">No pre-class materials yet.</p>
            return (
              <div className="space-y-4">
                {preClass.video && !preClass.simulation && !preClass.quiz?.length ? (
                  <MarkdownRender content={preClass.video} />
                ) : (
                  <>
                    {preClass.video && <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Video / Resource</h4><p className="text-sm">{preClass.video}</p></div>}
                    {preClass.simulation && <div><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Simulation</h4><p className="text-sm">{preClass.simulation}</p></div>}
                  </>
                )}
                {preClass.quiz && preClass.quiz.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Entry Quiz</h4>
                    <div className="space-y-3">
                      {preClass.quiz.map((q, i) => (
                        <div key={i} className="rounded-lg border p-3 text-sm">
                          <p className="font-medium mb-1"><MarkdownRender content={`${i + 1}. ${q.question}`} /></p>
                          <ul className="space-y-0.5 mb-1">
                            {q.options.map((opt, j) => (
                              <li key={j} className="text-xs text-muted-foreground">{String.fromCharCode(65 + j)}. {opt}</li>
                            ))}
                          </ul>
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Answer: {q.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="pre-class" canEdit={isSuperAdmin || isTeacher} />}

        {/* 4. LAB LOGISTICS */}
        <SectionCard number={4} title="Lab Logistics" section="lab" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {labLogistics.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lab logistics yet.</p>
          ) : labLogistics.length === 1 && labLogistics[0].quantity === 0 ? (
            <MarkdownRender content={labLogistics[0].item} />
          ) : (
            <div className="space-y-1">
              {labLogistics.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span className="font-medium">{item.item}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Qty: {item.quantity}</span>
                    {item.notes && <span>{item.notes}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="lab-logistics" canEdit={isSuperAdmin || isTeacher} />}

        {/* 5. WA BLAST */}
        <SectionCard number={5} title="WA Blast Message" section="wa-blast" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {waBlast ? (
            <div className="rounded-lg bg-muted p-4">
              <p className="whitespace-pre-wrap text-sm">{typeof waBlast === "string" ? waBlast : JSON.stringify(waBlast)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No WA blast message yet.</p>
          )}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="wa-blast" canEdit={isSuperAdmin || isTeacher} />}

        {/* 6. ANSWER KEYS */}
        <SectionCard number={6} title="Answer Keys" section="answers" editingSection={editingSection} editContent={editContent} setEditContent={setEditContent} startEdit={startEdit} saveEdit={saveEdit} setEditingSection={setEditingSection}>
          {answerKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answer keys yet.</p>
          ) : answerKeys.length === 1 && (answerKeys[0].question === "Custom Content" || answerKeys[0].question === "Template") ? (
            <MarkdownRender content={answerKeys[0].answer} />
          ) : (
            <div className="space-y-3">
              {answerKeys.map((ak, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-1">{ak.question}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">Answer: {ak.answer}</p>
                  {ak.explanation && <p className="mt-1 text-xs text-muted-foreground">{ak.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        {pkg && <MediaSection packageId={pkg.id} section="answer-keys" canEdit={isSuperAdmin || isTeacher} />}

      </div>
    </div>
  )
}

function SectionCard({
  number, title, section, editingSection, editContent, setEditContent, startEdit, saveEdit, setEditingSection, children,
}: {
  number: number
  title: string
  section: string
  editingSection: string | null
  editContent: string
  setEditContent: (v: string) => void
  startEdit: (s: string) => void
  saveEdit: () => void
  setEditingSection: (s: string | null) => void
  children: React.ReactNode
}) {
  const isEditing = editingSection === section
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{number}</span>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1 no-print">
            {isEditing ? (
              <><Button variant="default" size="sm" className="h-7 text-xs" onClick={saveEdit}><FileDown className="mr-1 h-3 w-3" />Save</Button><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingSection(null)}>Cancel</Button></>
            ) : (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => startEdit(section)}><Pencil className="mr-1 h-3 w-3" />Edit</Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <textarea className="w-full min-h-[200px] rounded-lg border border-input bg-background p-4 text-sm font-mono" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
        ) : children}
      </CardContent>
    </Card>
  )
}
