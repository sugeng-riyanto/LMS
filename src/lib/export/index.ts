import type { WeeklyPackage } from "@/types/package"
import { jsPDF } from "jspdf"

// ========== PROFESSIONAL EXPORT TEMPLATES ==========

function coverPage(pkg: Partial<WeeklyPackage>, schoolName?: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  const name = schoolName || "Sekolah Harapan Bangsa - Modernhill"
  return [
    `---`,
    `title: "Weekly Teaching Package"`,
    `subtitle: "Grade ${pkg.grade} — Week ${pkg.week_number}"`,
    `date: "${date}"`,
    `topic: "${pkg.topic ?? ""}"`,
    `school: "${name}"`,
    `---`,
    ``,
    `# ${name}`,
    ``,
    `## Weekly Teaching Package`,
    ``,
    `**Grade:** ${pkg.grade}  |  **Week:** ${pkg.week_number}  |  **Date:** ${date}  |  **Topic:** ${pkg.topic ?? ""}`,
    ``,
    `---`,
    ``,
  ].join("\n")
}

function lpSection(pkg: Partial<WeeklyPackage>): string {
  const lp = pkg.lesson_plan as Record<string, unknown> | undefined
  if (!lp) return ""
  // Custom markdown content
  if (lp._md) return `## Lesson Plan\n\n${lp._md}\n\n`
  const phases = (lp.phases as Array<Record<string, unknown>>) ?? []
  let out = `## Lesson Plan\n\n`
  if (lp.title) out += `**${lp.title}**  \n`
  out += `**Duration:** ${lp.duration_minutes ?? 40} minutes  \n`
  out += `**Calendar:** ${pkg.calendar_status ?? "normal"}  \n`
  out += `**Syllabus Ref:** ${pkg.syllabus_ref ?? "—"}\n\n`
  phases.forEach((p, i) => {
    out += `### ${i + 1}. ${p.phase} (${p.minutes} min)\n\n`
    if (p.hook_question) out += `**Hook:** ${p.hook_question}\n\n`
    if (p.activity) out += `${p.activity}\n\n`
    if (p.mythbuster_or_analogy) out += `**MythBuster:** ${p.mythbuster_or_analogy}\n\n`
    if (p.differentiation) out += `**Differentiation:** ${p.differentiation}\n\n`
    if (p.reflection_prompt) out += `**Reflection:**  \n${p.reflection_prompt}\n\n`
  })
  return out
}

function wsSection(pkg: Partial<WeeklyPackage>): string {
  const ws = pkg.worksheet as Record<string, unknown> | undefined
  if (!ws) return ""
  if (ws._md) return `## Worksheet\n\n${ws._md}\n\n`
  const levels = (ws.levels as Array<Record<string, unknown>>) ?? []
  let out = `## Worksheet\n\n`
  if (ws.title) out += `**${ws.title}**\n\n`
  levels.forEach((l) => {
    const questions = (l.questions as Array<Record<string, unknown>>) ?? []
    out += `### Level ${l.level}: ${l.name} (${l.minutes} min)\n\n`
    questions.forEach((q: Record<string, unknown>) => {
      out += `**Q${q.id}.** ${q.question}\n\n`
      if (q.options) {
        (q.options as string[]).forEach((o, i) => {
          const c = q.correct as string
          out += `- ${o === c ? "[x]" : "[ ]"} ${o}\n`
        })
        out += "\n"
      }
      if (q.mark_scheme) out += `*Mark scheme:* ${q.mark_scheme}\n\n`
      if (q.intentional_error) out += `*Intentional error:* ${q.intentional_error}\n\n`
    })
  })
  return out
}

function pcSection(pkg: Partial<WeeklyPackage>): string {
  const pc = pkg.pre_class as Record<string, unknown> | undefined
  if (!pc) return ""
  if (pc._md) return `## Pre-Class Materials\n\n${pc._md}\n\n`
  const vr = pc.video_resource as Record<string, unknown> | undefined
  const sim = pc.interactive_simulation as Record<string, unknown> | undefined
  const quiz = pc.entry_ticket_quiz as Record<string, unknown> | undefined
  let out = `## Pre-Class Materials\n\n`
  if (vr) {
    out += `### Video Resource\n`
    out += `- **Title:** ${vr.title}\n- **URL:** ${vr.url}\n- **Source:** ${vr.source}\n- **Duration:** ${vr.duration_minutes} min\n- **Key Concepts:** ${(vr.key_concepts as string[])?.join(", ") ?? ""}\n- **Watch Guide:** ${vr.watch_guide}\n\n`
  }
  if (sim) {
    out += `### Interactive Simulation\n`
    out += `- **Title:** ${sim.title}\n- **URL:** ${sim.url}\n- **Platform:** ${sim.platform}\n- **Instructions:** ${sim.instructions}\n`
    const iq = sim.inquiry_questions as string[] | undefined
    if (iq?.length) out += `- **Inquiry Questions:**\n${iq.map((q) => `  - ${q}`).join("\n")}\n\n`
  }
  if (quiz) {
    const qs = (quiz.questions as Array<Record<string, unknown>>) ?? []
    if (qs.length) {
      out += `### Entry Ticket Quiz (Passing: ${quiz.passing_score}/${qs.length})\n\n`
      qs.forEach((q, i) => {
        out += `**${i + 1}.** ${q.question}\n\n`
        ;(q.options as string[]).forEach((o, j) => out += `- ${j === (q.correct as number) ? "[x]" : "[ ]"} ${o}\n`)
        out += `\n*Explanation:* ${q.explanation}\n\n`
      })
    }
  }
  return out
}

function llSection(pkg: Partial<WeeklyPackage>): string {
  const ll = pkg.lab_logistics as Record<string, unknown> | undefined
  if (!ll) return ""
  if (ll._md) return `## Lab Logistics\n\n${ll._md}\n\n`
  const equip = (ll.equipment_list as Array<Record<string, unknown>>) ?? []
  let out = `## Lab Logistics\n\n`
  out += `**Lab Required:** ${ll.lab_required ? "Yes" : "No"}\n\n`
  if (equip.length) {
    out += `| Item | Qty | Status |\n|------|-----|--------|\n`
    const statusLabel: Record<string, string> = { available: "Available", limited: "Limited", needs_order: "Needs Order", out_of_stock: "Out of Stock" }
    equip.forEach((e) => out += `| ${e.item} | ${e.quantity} | ${statusLabel[e.status as string] ?? e.status} |\n`)
    out += "\n"
  }
  const setup = ll.setup_instructions as string[] | undefined
  if (setup?.length) out += `**Setup:**\n${setup.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n`
  const safety = ll.safety_notes as string[] | undefined
  if (safety?.length) out += `**Safety:**\n${safety.map((s) => `- ${s}`).join("\n")}\n\n`
  if (ll.lab_technician_message) out += `**Lab Message:** ${ll.lab_technician_message}\n\n`
  return out
}

function waSection(pkg: Partial<WeeklyPackage>): string {
  const wa = pkg.wa_blast as string
  if (!wa) return ""
  return `## WA Blast Message\n\n\`\`\`\n${wa}\n\`\`\`\n\n`
}

function akSection(pkg: Partial<WeeklyPackage>): string {
  const ak = pkg.answer_keys as unknown
  if (!ak) return ""
  if (typeof ak === "object" && !Array.isArray(ak) && (ak as Record<string, unknown>)._md) return `## Answer Keys\n\n${(ak as Record<string, unknown>)._md}\n\n`
  if (!Array.isArray(ak) || !ak.length) return ""
  let out = `## Answer Keys\n\n`
  ak.forEach((k, i) => {
    out += `### ${i + 1}. ${k.question}\n\n**Answer:** ${k.answer}\n\n`
    if (k.explanation) out += `*Explanation:* ${k.explanation}\n\n`
  })
  return out
}

function fullContent(pkg: Partial<WeeklyPackage>): string {
  return [lpSection(pkg), wsSection(pkg), pcSection(pkg), llSection(pkg), waSection(pkg), akSection(pkg)]
    .filter(Boolean).join("---\n\n")
}

function footer(): string {
  return `---\n\n*Generated by Physics Command Center — SHB Modernhill*\n`
}

// ========== PUBLIC EXPORT FUNCTIONS ==========

export function generateMD(pkg: Partial<WeeklyPackage>, schoolName?: string): string {
  return coverPage(pkg, schoolName) + fullContent(pkg) + footer()
}

export function generateQMD(pkg: Partial<WeeklyPackage>, schoolName?: string): string {
  const meta = [
    "---",
    `title: "Weekly Teaching Package — Grade ${pkg.grade} Week ${pkg.week_number}"`,
    ...(schoolName ? [`school: "${schoolName}"`] : []),
    `topic: "${pkg.topic ?? ""}"`,
    "format: pdf",
    "toc: true",
    "number-sections: true",
    "---",
    "",
  ].join("\n")
  return meta + fullContent(pkg) + footer()
}

export function generateSyllabusMD(
  grade: number, week: number, topic: string,
  opening: string, questions: Array<Record<string, unknown>>, problems: Array<Record<string, unknown>>,
  events: Array<Record<string, unknown>>, curriculum: string, syllabusRef: string,
): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
  let md = [
    "---",
    `title: "Syllabus Plan — Grade ${grade}, Week ${week}"`,
    `topic: "${topic}"`,
    `date: "${date}"`,
    "---",
    "",
    `# Syllabus Plan`,
    "",
    `**Grade:** ${grade}  |  **Week:** ${week}  |  **Date:** ${date}`,
    `**Topic:** ${topic}`,
    `**Curriculum:** ${curriculum}`,
    `**Syllabus Ref:** ${syllabusRef}`,
    "",
    "---",
    "",
    "## Opening Ideas",
    "",
    opening || "*No opening ideas set.*",
    "",
    "---",
    "",
    "## Activity Questions",
    "",
  ].join("\n")

  if (!questions.length) {
    md += "*No questions set.*\n\n"
  } else {
    questions.forEach((q, i) => {
      md += `### ${i + 1}. ${q.question}\n\n`
      if (q.bloom) md += `**Bloom:** ${q.bloom}  |  **Time:** ${q.timing ?? "20 min"}\n\n`
    })
  }

  md += "---\n\n## Problems\n\n"
  if (!problems.length) {
    md += "*No problems set.*\n\n"
  } else {
    problems.forEach((p, i) => {
      md += `### ${i + 1}. ${p.problem}\n\n`
      if (p.level) md += `**Level:** ${p.level}\n\n`
    })
  }

  if (events.length) {
    md += "---\n\n## Calendar Events\n\n"
    events.forEach((e) => md += `- **${e.event_name}** (${e.event_type})  \n`)
    md += "\n"
  }

  md += footer()
  return md
}

function parseInlineMarkdown(text: string): Array<{ text: string; bold: boolean }> {
  const parts: Array<{ text: string; bold: boolean }> = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index), bold: false })
    parts.push({ text: match[1], bold: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), bold: false })
  return parts.length ? parts : [{ text, bold: false }]
}

export async function generateDOCX(pkg: Partial<WeeklyPackage>, schoolName?: string): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")

  const md = fullContent(pkg)
  const children: any[] = [
    ...(schoolName ? [new Paragraph({ text: schoolName, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } })] : []),
    new Paragraph({ text: `Weekly Teaching Package — Grade ${pkg.grade} Week ${pkg.week_number}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
  ]

  function mkPara(text: string, opts?: { bullet?: boolean; spacing?: number }): any {
    const parts = parseInlineMarkdown(text)
    const runs = parts.map((p) => new TextRun({ text: p.text, bold: p.bold }))
    return new Paragraph({ children: runs, spacing: { after: opts?.spacing ?? 100 }, ...(opts?.bullet ? { bullet: { level: 0 } } : {}) })
  }

  const lines = md.split("\n")
  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith("---")) continue
    if (t.startsWith("### ")) children.push(new Paragraph({ text: t.slice(4), heading: HeadingLevel.HEADING_3, spacing: { before: 150, after: 80 } }))
    else if (t.startsWith("## ")) children.push(new Paragraph({ text: t.slice(3), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }))
    else if (t.startsWith("# ")) continue
    else if (t.startsWith("- ") || /^\d+\.\s/.test(t)) children.push(mkPara(t, { bullet: true, spacing: 60 }))
    else if (t.startsWith("|") && t.includes("|---")) continue
    else if (t.startsWith("|")) {
      const cells = t.split("|").filter(Boolean).map((c) => c.trim())
      if (cells.length >= 2) children.push(mkPara(cells.slice(0, 4).join("  |  "), { spacing: 50 }))
    } else children.push(mkPara(t))
  }

  const doc = new Document({ sections: [{ children }] })
  return Buffer.from(await Packer.toBuffer(doc))
}

export async function generatePDF(pkg: Partial<WeeklyPackage>, schoolName?: string): Promise<Buffer> {
  const md = generateMD(pkg, schoolName)
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pw = 180, ml = 15
  let y = 25
  const bottomLimit = 270
  const lineH = 5.5

  function addPage() {
    doc.addPage(); y = 25
    // Page number
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.text("Physics Command Center — SHB Modernhill", ml, 285);
    doc.setFont("helvetica", "normal")
  }
  function checkSpace(needed: number) { if (y + needed > bottomLimit) addPage() }
  function write(text: string, size: number, style: string, indent = 0) {
    doc.setFontSize(size); doc.setFont("helvetica", style as any)
    const wrapped = doc.splitTextToSize(text.replace(/\*\*/g, ""), pw - indent)
    wrapped.forEach((w: string) => { checkSpace(lineH); doc.text(w, ml + indent, y); y += lineH })
  }

  // Cover header
  checkSpace(30)
  doc.setFontSize(20); doc.setFont("helvetica", "bold")
  doc.text(schoolName || "SEKOLAH HARAPAN BANGSA - MODERNHILL", ml, y); y += 9
  doc.setFontSize(16); doc.setFont("helvetica", "bold")
  doc.text(`Weekly Teaching Package`, ml, y); y += 8
  doc.setFontSize(11); doc.setFont("helvetica", "normal")
  doc.text(`Grade ${pkg.grade} · Week ${pkg.week_number} · ${pkg.topic ?? ""} · ${new Date().toLocaleDateString("en-GB")}`, ml, y); y += 8
  doc.setDrawColor(200); doc.line(ml, y, ml + pw, y); y += 8

  // Content
  const lines = md.split("\n")
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (!t || t.startsWith("---") || t.startsWith("```")) continue

    // Section headings
    if (t.startsWith("## ")) {
      checkSpace(14)
      doc.setFontSize(14); doc.setFont("helvetica", "bold")
      doc.text(t.slice(3).toUpperCase(), ml, y); y += 7
      doc.setDrawColor(200); doc.line(ml, y - 2, ml + pw, y - 2)
      continue
    }
    if (t.startsWith("### ")) {
      checkSpace(10)
      doc.setFontSize(12); doc.setFont("helvetica", "bold")
      doc.text(t.slice(4), ml, y); y += 6
      continue
    }

    // Section separator
    if (t.startsWith("**") && t.endsWith("**") && t.length < 40) {
      checkSpace(8)
      doc.setFontSize(11); doc.setFont("helvetica", "bold")
      doc.text(t.replace(/\*\*/g, ""), ml, y); y += 5.5
      continue
    }

    // Table detection
    if (t.startsWith("|") && t.includes("|")) {
      if (!inTable) { inTable = true; checkSpace(8) }
      const cells = t.split("|").filter(Boolean).map((c) => c.trim()).filter((c) => c.length > 0 && !c.match(/^[-:\s]+$/))
      if (cells.length >= 2 && !cells[0].includes("---")) {
        const tableText = cells.slice(0, 5).join(" | ")
        doc.setFontSize(8.5); doc.setFont("helvetica", "normal")
        const wrapped = doc.splitTextToSize(tableText, pw - 5)
        wrapped.forEach((w: string) => { checkSpace(4); doc.text(w, ml + 2, y); y += 4 })
      }
      continue
    }
    inTable = false

    // Regular content
    write(t, 10, "normal")
  }

  // Footer
  checkSpace(10)
  doc.setDrawColor(200); doc.line(ml, y, ml + pw, y); y += 5
  doc.setFontSize(8); doc.setFont("helvetica", "italic")
  doc.text("Generated by Physics Command Center — SHB Modernhill", ml, y)

  return Buffer.from(doc.output("arraybuffer"))
}
