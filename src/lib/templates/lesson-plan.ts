import AdmZip from "adm-zip"
import path from "path"
import fs from "fs"
import { jsPDF } from "jspdf"

const TEMPLATE_DIR = path.join(process.cwd(), "public", "syllabus", "lessonplantemplate")

export interface LessonPlanVars {
  grade: number
  week: number
  year: string
  semester: string
  subject: string
  period1: string
  period2: string
  teacher: string
  ssbat: string
  date: string
  opening: string
  activities: string
  closing: string
  model: string
  classwork: string
  page: string
  assessment: string
  milestone: string
  reflection: string
  resources: string
  vp: string
  principal: string
  unit: string
}

export const DEFAULT_VARS: LessonPlanVars = {
  grade: 10, week: 1, year: "2026/2027", semester: "Semester 1",
  subject: "Physics", period1: "07:00", period2: "08:30", teacher: "",
  ssbat: "Students will be able to explain the fundamental concepts",
  date: "", opening: "Greeting, check attendance, pray, explain learning objectives, energizer",
  activities: "Review base concepts. Guided practice through worksheet. Group discussion.",
  closing: "Students and teacher summarise key points. Pray.",
  model: "Flipped Classroom", classwork: "", page: "",
  assessment: "Formative assessment through worksheet and class participation",
  milestone: "", reflection: "", resources: "", vp: "", principal: "", unit: "Academic",
}

function getLevel(grade: number): string {
  return grade <= 9 ? "JHS" : "SHS"
}

function replaceVars(text: string, vars: LessonPlanVars): string {
  const dateStr = vars.date || new Date().toLocaleDateString("en-GB")
  const map: Record<string, string> = {
    "<<Year>>": vars.year, "<<Semester>>": vars.semester,
    "<<subject>>": vars.subject, "<<Period1>>": vars.period1,
    "<<Period2>>": vars.period2, "<<teacher>>": vars.teacher,
    "<<Grade>>": String(vars.grade), "<<ssbat>>": vars.ssbat,
    "<<Date>>": dateStr, "<<Opening>>": vars.opening,
    "<<Activities>>": vars.activities, "<<Closing>>": vars.closing,
    "<<model>>": vars.model, "<<Classwork>>": vars.classwork,
    "<<page>>": vars.page, "<<Assessment>>": vars.assessment,
    "<<Milestone>>": vars.milestone, "<<Reflection>>": vars.reflection, "<<Resources>>": vars.resources,
    "<<vp>>": vars.vp, "<<principal>>": vars.principal, "<<unit>>": vars.unit,
    "__Grade__": String(vars.grade), "__Period1__": vars.period1, "__Period2__": vars.period2,
  }
  let result = text
  for (const [key, value] of Object.entries(map)) {
    result = result.split(key).join(value)
  }
  return result
}

function unescapeTemplate(text: string): string {
  // MD templates have backslash-escaped angle brackets: \<\<Year\>\> instead of <<Year>>
  return text.replace(/\\</g, "<").replace(/\\>/g, ">").replace(/\\(?![<>\-])/g, "")
}

function loadMDTemplate(grade: number): string {
  const level = getLevel(grade)
  const p = path.join(TEMPLATE_DIR, `${level} LESSON PLAN __Grade__ period at __Period1__-__Period2__.md`)
  return unescapeTemplate(fs.readFileSync(p, "utf8"))
}

function loadResources(): string {
  const p = path.join(TEMPLATE_DIR, "Resources.md")
  return unescapeTemplate(fs.readFileSync(p, "utf8"))
}

function toXmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // DOCX <w:t> doesn't render raw newlines — collapse them to spaces
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
}

export async function fillDOCX(vars: LessonPlanVars): Promise<Buffer> {
  const level = getLevel(vars.grade)
  const templatePath = path.join(TEMPLATE_DIR, `${level} LESSON PLAN __Grade__ period at __Period1__-__Period2__.docx`)

  const zip = new AdmZip(templatePath)
  for (const entry of zip.getEntries()) {
    if (entry.entryName.endsWith(".xml") || entry.entryName.endsWith(".rels")) {
      let content = entry.getData().toString("utf8")
      // Replace &lt;&lt;...&gt;&gt; patterns (XML-encoded)
      const xmlMap: Record<string, string> = {
        "&lt;&lt;Year&gt;&gt;": toXmlText(vars.year),
        "&lt;&lt;Semester&gt;&gt;": toXmlText(vars.semester),
        "&lt;&lt;subject&gt;&gt;": toXmlText(vars.subject),
        "&lt;&lt;Period1&gt;&gt;": toXmlText(vars.period1),
        "&lt;&lt;Period2&gt;&gt;": toXmlText(vars.period2),
        "&lt;&lt;teacher&gt;&gt;": toXmlText(vars.teacher),
        "&lt;&lt;Grade&gt;&gt;": toXmlText(String(vars.grade)),
        "&lt;&lt;ssbat&gt;&gt;": toXmlText(vars.ssbat),
        "&lt;&lt;Date&gt;&gt;": toXmlText(vars.date || new Date().toLocaleDateString("en-GB")),
        "&lt;&lt;Opening&gt;&gt;": toXmlText(vars.opening),
        "&lt;&lt;Activities&gt;&gt;": toXmlText(vars.activities),
        "&lt;&lt;Closing&gt;&gt;": toXmlText(vars.closing),
        "&lt;&lt;model&gt;&gt;": toXmlText(vars.model),
        "&lt;&lt;Classwork&gt;&gt;": toXmlText(vars.classwork),
        "&lt;&lt;page&gt;&gt;": toXmlText(vars.page),
        "&lt;&lt;Assessment&gt;&gt;": toXmlText(vars.assessment),
        "&lt;&lt;Milestone&gt;&gt;": toXmlText(vars.milestone),
        "&lt;&lt;Reflection&gt;&gt;": toXmlText(vars.reflection),
        "&lt;&lt;Resources&gt;&gt;": toXmlText(vars.resources),
        "&lt;&lt;vp&gt;&gt;": toXmlText(vars.vp),
        "&lt;&lt;principal&gt;&gt;": toXmlText(vars.principal),
        "&lt;&lt;unit&gt;&gt;": toXmlText(vars.unit),
      }
      for (const [k, v] of Object.entries(xmlMap)) {
        content = content.split(k).join(v)
      }
      zip.updateFile(entry, Buffer.from(content, "utf8"))
    }
  }
  return zip.toBuffer()
}

function filterResourcesByGrade(md: string, grade: number): string {
  // Determine which columns to keep based on grade
  const columns: number[] = grade <= 8 ? [0, 4] : grade <= 10 ? [1, 3, 4] : grade === 11 ? [2, 3] : [2]
  const lines = md.split("\n")
  return lines.map((line) => {
    if (!line.trim().startsWith("|")) return line
    const cells = line.split("|")
    if (cells.length <= 2) return line
    // Keep header row + separator row + selected columns
    const isHeader = cells.some((c) => /^[\s:\-]+$/.test(c.trim()) || c.trim() === "Resources" || c.trim() === "")
    if (isHeader) {
      const kept = columns.map((i) => cells[i] ?? "")
      return "| " + kept.join(" | ") + " |"
    }
    // Data rows: keep only selected columns
    const kept = columns.map((i) => cells[i] ?? "")
    // Skip if all kept cells are empty
    if (kept.every((c) => !c.trim())) return ""
    return "| " + kept.join(" | ") + " |"
  }).filter(Boolean).join("\n")
}

export function generateLessonPlanMD(vars: LessonPlanVars): string {
  const template = loadMDTemplate(vars.grade)
  const resources = loadResources()
  let md = replaceVars(template, vars)
  md = md.replace(/^\[image\d+\]:\s*<data:image\/[^>]+>\s*$/gm, "")
  const resourcesClean = replaceVars(resources, vars)
    .replace(/^\[image\d+\]:\s*<data:image\/[^>]+>\s*$/gm, "")
  const filteredResources = filterResourcesByGrade(resourcesClean, vars.grade)
  md += "\n\n---\n\n## Resources\n\n" + filteredResources
  return md
}

export function generateLessonPlanQMD(vars: LessonPlanVars): string {
  const md = generateLessonPlanMD(vars)
  const meta = [
    "---",
    `title: "Lesson Plan - ${vars.subject} Grade ${vars.grade} Week ${vars.week}"`,
    `date: "${vars.date || new Date().toLocaleDateString("en-GB")}"`,
    "format: pdf",
    "toc: true",
    "---",
    "",
  ].join("\n")
  // Strip any existing YAML frontmatter in the template
  const body = md.replace(/^---[\s\S]*?---\n\n/, "")
  return meta + body
}

export async function generateLessonPlanPDF(vars: LessonPlanVars): Promise<Buffer> {
  const md = generateLessonPlanMD(vars)
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" })
  const pageW = 270
  let y = 20
  const pageH = 190

  const lines = md.split("\n")
  for (const line of lines) {
    if (y > pageH) {
      doc.addPage()
      y = 20
    }

    const trimmed = line.trim()

    if (trimmed.startsWith("# ")) {
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(trimmed.replace(/^# /, ""), 10, y)
      y += 8
    } else if (trimmed.startsWith("## ")) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text(trimmed.replace(/^## /, ""), 10, y)
      y += 7
    } else if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.text(trimmed.replace(/^\*\*|\*\*$/g, ""), 10, y)
      y += 6
    } else if (trimmed.startsWith("|") && trimmed.includes("---")) {
      // Table separator — skip
    } else if (trimmed.startsWith("|")) {
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim())
      if (cells.length > 1) {
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        let x = 10
        const colW = pageW / cells.length
        cells.forEach((cell) => {
          doc.text(cell.substring(0, Math.min(cell.length, 50)), x, y)
          x += colW
        })
        y += 4
      }
    } else if (trimmed.startsWith("![") || trimmed.startsWith("[image") || trimmed.startsWith("data:") || trimmed.length > 300) {
      // Skip images and long data lines in PDF
    } else if (trimmed === "") {
      y += 3
    } else {
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      const wrapped = doc.splitTextToSize(trimmed, pageW)
      wrapped.forEach((t: string) => {
        if (y > pageH) { doc.addPage(); y = 20 }
        doc.text(t, 10, y)
        y += 5
      })
    }
  }

  return Buffer.from(doc.output("arraybuffer"))
}
