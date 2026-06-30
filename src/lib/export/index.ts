import type { WeeklyPackage } from "@/types/package"

interface Section { title: string; content: string }
interface LpPhase { phase: string; minutes: number; hook_question?: string; activity?: string; mythbuster_or_analogy?: string; differentiation?: string; reflection_prompt?: string }
interface WsQuestion { id: string; type?: string; bloom?: string; question: string; options?: string[]; correct?: string; mark_scheme?: string; intentional_error?: string; solution_steps?: string[] }
interface WsLevel { level: number; name: string; minutes: number; questions: WsQuestion[] }
interface PcVideo { title: string; url: string; source: string; duration_minutes: number; key_concepts: string[]; watch_guide: string }
interface PcSim { title: string; url: string; platform: string; instructions: string; inquiry_questions: string[] }
interface PcQuizQ { question: string; options: string[]; correct: number; explanation: string }
interface LlEquip { item: string; quantity: number; status: string }
interface AkItem { question: string; answer: string; explanation: string }

const LP_EMPTY = "No lesson plan available."
const WS_EMPTY = "No worksheet available."
const PC_EMPTY = "No pre-class materials available."
const LL_EMPTY = "No lab logistics available."
const WA_EMPTY = "No WA Blast message available."
const AK_EMPTY = "No answer keys available."

function extractSections(pkg: WeeklyPackage): Record<string, Section> {
  return {
    "lesson-plan": { title: "Lesson Plan", content: renderLP(pkg) },
    worksheet: { title: "Worksheet", content: renderWS(pkg) },
    "pre-class": { title: "Pre-Class Materials", content: renderPC(pkg) },
    "lab-logistics": { title: "Lab Logistics", content: renderLL(pkg) },
    "wa-blast": { title: "WA Blast", content: renderWA(pkg) },
    "answer-keys": { title: "Answer Keys", content: renderAK(pkg) },
  }
}

function renderLP(pkg: WeeklyPackage): string {
  const lp = pkg.lesson_plan as { title?: string; duration_minutes?: number; phases?: LpPhase[] } | undefined
  if (!lp) return LP_EMPTY
  let out = "# Lesson Plan\n\n"
  if (lp.title) out += `**${lp.title}**\n\n`
  out += `**Grade:** ${pkg.grade} | **Week:** ${pkg.week_number} | **Duration:** ${lp.duration_minutes ?? 40} min\n\n`
  out += `**Calendar:** ${pkg.calendar_status ?? "normal"} | **Syllabus:** ${pkg.syllabus_ref ?? "—"}\n\n`
  if (lp.phases) {
    lp.phases.forEach((ph, i) => {
      out += `## ${i + 1}. ${ph.phase} (${ph.minutes} min)\n\n`
      if (ph.hook_question) out += `**Hook:** ${ph.hook_question}\n\n`
      if (ph.activity) out += `${ph.activity}\n\n`
      if (ph.mythbuster_or_analogy) out += `**MythBuster:** ${ph.mythbuster_or_analogy}\n\n`
      if (ph.differentiation) out += `**Differentiation:** ${ph.differentiation}\n\n`
      if (ph.reflection_prompt) out += `**Reflection:**\n${ph.reflection_prompt}\n\n`
    })
  }
  return out
}

function renderWS(pkg: WeeklyPackage): string {
  const ws = pkg.worksheet as { title?: string; levels?: WsLevel[] } | undefined
  if (!ws) return WS_EMPTY
  let out = "# Worksheet\n\n"
  if (ws.title) out += `**${ws.title}**\n\n`
  if (ws.levels) {
    ws.levels.forEach((lv) => {
      out += `## Level ${lv.level}: ${lv.name} (${lv.minutes} min)\n\n`
      lv.questions.forEach((q) => {
        out += `### Q${q.id}. ${q.question}\n\n`
        if (q.bloom) out += `**Bloom:** ${q.bloom}\n`
        if (q.type) out += `**Type:** ${q.type}\n`
        if (q.options && q.options.length > 0) {
          out += "**Options:**\n"
          q.options.forEach((o) => { out += `- ${o === q.correct ? "[x]" : "[ ]"} ${o}\n` })
          out += "\n"
        }
        if (q.mark_scheme) out += `**Mark Scheme:** ${q.mark_scheme}\n`
        if (q.intentional_error) out += `**Intentional Error:** ${q.intentional_error}\n`
        if (q.solution_steps && q.solution_steps.length > 0) {
          out += "**Solution Steps:**\n"
          q.solution_steps.forEach((s, i) => { out += `${i + 1}. ${s}\n` })
          out += "\n"
        }
      })
    })
  }
  return out
}

function renderPC(pkg: WeeklyPackage): string {
  const pc = pkg.pre_class as { video_resource?: PcVideo; interactive_simulation?: PcSim; entry_ticket_quiz?: { questions: PcQuizQ[]; passing_score: number } } | undefined
  if (!pc) return PC_EMPTY
  let out = "# Pre-Class Materials\n\n"
  if (pc.video_resource) {
    const v = pc.video_resource
    out += "## Video Resource\n"
    out += `- **Title:** ${v.title}\n- **URL:** ${v.url}\n- **Source:** ${v.source}\n- **Duration:** ${v.duration_minutes} min\n- **Concepts:** ${v.key_concepts.join(", ")}\n- **Guide:** ${v.watch_guide}\n\n`
  }
  if (pc.interactive_simulation) {
    const s = pc.interactive_simulation
    out += "## Interactive Simulation\n"
    out += `- **Title:** ${s.title}\n- **URL:** ${s.url}\n- **Platform:** ${s.platform}\n- **Instructions:** ${s.instructions}\n`
    if (s.inquiry_questions.length > 0) {
      out += "- **Inquiry Questions:**\n"
      s.inquiry_questions.forEach((q) => { out += `  - ${q}\n` })
      out += "\n"
    }
  }
  if (pc.entry_ticket_quiz && pc.entry_ticket_quiz.questions.length > 0) {
    const eq = pc.entry_ticket_quiz
    out += "## Entry Ticket Quiz\n"
    out += `**Passing Score:** ${eq.passing_score}%\n\n`
    eq.questions.forEach((q, i) => {
      out += `### ${i + 1}. ${q.question}\n\n`
      q.options.forEach((o, j) => { out += `- ${j === q.correct ? "[x]" : "[ ]"} ${o}\n` })
      out += `\n*Explanation:* ${q.explanation}\n\n`
    })
  }
  return out
}

function renderLL(pkg: WeeklyPackage): string {
  const ll = pkg.lab_logistics as { lab_required?: boolean; equipment_list?: LlEquip[]; setup_instructions?: string[]; safety_notes?: string[]; lab_technician_message?: string } | undefined
  if (!ll) return LL_EMPTY
  let out = "# Lab Logistics\n\n"
  out += `**Lab Required:** ${ll.lab_required ? "Yes" : "No"}\n\n`
  if (ll.equipment_list && ll.equipment_list.length > 0) {
    out += "## Equipment List\n\n| Item | Qty | Status |\n|------|-----|--------|\n"
    const sm: Record<string, string> = { available: "Available", limited: "Limited", needs_order: "Needs Order", out_of_stock: "Out of Stock" }
    ll.equipment_list.forEach((e) => { out += `| ${e.item} | ${e.quantity} | ${sm[e.status] ?? e.status} |\n` })
    out += "\n"
  }
  if (ll.setup_instructions && ll.setup_instructions.length > 0) {
    out += "## Setup Instructions\n\n"
    ll.setup_instructions.forEach((s, i) => { out += `${i + 1}. ${s}\n` })
    out += "\n"
  }
  if (ll.safety_notes && ll.safety_notes.length > 0) {
    out += "## Safety Notes\n\n"
    ll.safety_notes.forEach((s) => { out += `- ${s}\n` })
    out += "\n"
  }
  if (ll.lab_technician_message) out += `**Lab Message:** ${ll.lab_technician_message}\n\n`
  return out
}

function renderWA(pkg: WeeklyPackage): string {
  const wa = (pkg.wa_blast as string) ?? ""
  return wa ? "# WA Blast Message\n\n```\n" + wa + "\n```\n\n" : WA_EMPTY
}

function renderAK(pkg: WeeklyPackage): string {
  const ak = pkg.answer_keys as AkItem[] | undefined
  if (!ak || ak.length === 0) return AK_EMPTY
  let out = "# Answer Keys\n\n"
  ak.forEach((k, i) => {
    out += `### ${i + 1}. ${k.question}\n\n**Answer:** ${k.answer}\n\n`
    if (k.explanation) out += `*Explanation:* ${k.explanation}\n\n`
  })
  return out
}

function fullMD(pkg: WeeklyPackage): string {
  const secs = extractSections(pkg)
  return Object.values(secs).map((s) => s.content).filter((c) => c.length > 5).join("---\n\n")
}

export function generateMD(pkg: WeeklyPackage): string {
  const meta = [
    "---",
    `title: "Weekly Teaching Package — Grade ${pkg.grade} Week ${pkg.week_number}"`,
    `topic: ${pkg.topic ?? ""}`,
    `status: ${pkg.status}`,
    "---",
    "",
  ].join("\n")
  return meta + fullMD(pkg)
}

export function generateQMD(pkg: WeeklyPackage): string {
  const meta = [
    "---",
    `title: "Weekly Teaching Package — Grade ${pkg.grade} Week ${pkg.week_number}"`,
    "format: pdf",
    "toc: true",
    "---",
    "",
  ].join("\n")
  return meta + fullMD(pkg)
}

export async function generateDOCX(pkg: WeeklyPackage): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")
  const secs = extractSections(pkg)

  const children: any[] = [
    new Paragraph({ text: `Weekly Package — Grade ${pkg.grade} Week ${pkg.week_number}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
    new Paragraph({ children: [new TextRun({ text: `Topic: `, bold: true }), new TextRun(pkg.topic ?? "")], spacing: { after: 100 } }),
    new Paragraph({ children: [new TextRun({ text: `Status: `, bold: true }), new TextRun(pkg.status)], spacing: { after: 100 } }),
    new Paragraph({ spacing: { after: 400 } }),
  ]

  const addSec = (key: string) => {
    const sec = secs[key]
    if (!sec || sec.content.startsWith("No ")) return
    children.push(new Paragraph({ text: sec.title, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }))
    for (const line of sec.content.split("\n")) {
      const t = line.trim()
      if (!t) continue
      if (t.startsWith("### ")) children.push(new Paragraph({ text: t.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }))
      else if (t.startsWith("## ")) children.push(new Paragraph({ text: t.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }))
      else if (t.startsWith("# ")) { /* skip top-level headings */ }
      else if (t.startsWith("**") && t.endsWith("**")) children.push(new Paragraph({ children: [new TextRun({ text: t.slice(2, -2), bold: true })], spacing: { after: 100 } }))
      else if (t.startsWith("- ") || /^\d+\./.test(t)) children.push(new Paragraph({ text: t, spacing: { after: 60 }, bullet: { level: 0 } }))
      else if (t.startsWith("[x]") || t.startsWith("[ ]")) children.push(new Paragraph({ text: t, spacing: { after: 60 } }))
      else children.push(new Paragraph({ text: t, spacing: { after: 100 } }))
    }
  }

  addSec("lesson-plan")
  addSec("worksheet")
  addSec("pre-class")
  addSec("lab-logistics")
  addSec("wa-blast")
  addSec("answer-keys")

  const doc = new Document({ sections: [{ children }] })
  return Buffer.from(await Packer.toBuffer(doc))
}

export async function generatePDF(pkg: WeeklyPackage): Promise<Buffer> {
  return Buffer.from(generateMD(pkg), "utf-8")
}

export const SECTION_KEYS = ["lesson-plan", "worksheet", "pre-class", "lab-logistics", "wa-blast", "answer-keys"] as const
export const SECTION_LABELS: Record<string, string> = {
  "lesson-plan": "Lesson Plan", worksheet: "Worksheet", "pre-class": "Pre-Class",
  "lab-logistics": "Lab Logistics", "wa-blast": "WA Blast", "answer-keys": "Answer Keys",
}
