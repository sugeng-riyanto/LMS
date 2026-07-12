import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { getGradeSequence } from "@/lib/utils/week-calculator"
import { SUBJECT_GRADE_SEQUENCES } from "@/lib/syllabus/subject-templates"
import { SUBJECTS, GRADES } from "@/lib/utils/constants"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject") || "PHY"
    const grade = parseInt(searchParams.get("grade") || "10")

    if (!GRADES.includes(grade as any)) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 })
    }
    if (!SUBJECTS.find(s => s.code === subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 })
    }

    const subjectName = SUBJECTS.find(s => s.code === subject)!.name

    const wb = new ExcelJS.Workbook()
    wb.creator = "SHB Learning Hub"
    wb.created = new Date()

    const ws = wb.addWorksheet(`${subject} Grade ${grade}`)

    ws.columns = [
      { header: "Week", key: "week", width: 8 },
      { header: "Topic (pre-filled)", key: "topic", width: 45 },
      { header: "Subtopics (comma-separated)", key: "subtopics", width: 50 },
      { header: "Opening Ideas / Hook", key: "opening_ideas", width: 60 },
      { header: "Activity Questions", key: "activity_questions", width: 60 },
      { header: "Problems / Exercises", key: "problems", width: 60 },
      { header: "Score Category", key: "score_category", width: 20 },
      { header: "Max Score", key: "max_score", width: 12 },
      { header: "Media Links (comma-separated URLs)", key: "media_links", width: 50 },
    ]

    ws.getRow(1).font = { bold: true, size: 11 }
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } }

    const dataValidation = {
      type: "list" as const,
      formulae: ['"classwork,unit_test,project,homework,mid_semester,final_semester"'],
      showErrorMessage: true,
      errorTitle: "Invalid Category",
      error: "Must be: classwork, unit_test, project, homework, mid_semester, or final_semester",
    }

    for (let week = 1; week <= 22; week++) {
      let topic = ""
      const seq = SUBJECT_GRADE_SEQUENCES[subject as keyof typeof SUBJECT_GRADE_SEQUENCES]
      if (seq && seq[grade] && seq[grade][week]) {
        topic = seq[grade][week]
      } else {
        topic = getGradeSequence(grade, week)
      }

      const row = ws.addRow({
        week,
        topic,
        subtopics: "",
        opening_ideas: "",
        activity_questions: "",
        problems: "",
        score_category: "classwork",
        max_score: 100,
        media_links: "",
      })

      row.getCell(1).alignment = { horizontal: "center" }
      if (week % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F5F5" } }
        })
      }
    }

    for (let r = 2; r <= 23; r++) {
      ws.getRow(r).getCell(7).dataValidation = dataValidation
    }

    const instructionsSheet = wb.addWorksheet("Instructions")
    instructionsSheet.columns = [{ header: "How to use this template", key: "text", width: 100 }]
    instructionsSheet.addRow(["1. This template is pre-filled with 22 weeks of Cambridge-aligned topics for " + subjectName + " (Grade " + grade + ")."])
    instructionsSheet.addRow(["2. Fill in Subtopics: comma-separated list of sub-topics for each week."])
    instructionsSheet.addRow(["3. Opening Ideas: a hook, myth-buster, or engaging question to start the lesson."])
    instructionsSheet.addRow(["4. Activity Questions: one question per line. Format: 'Question | BloomLevel | Timing' (e.g. 'What is force? | remember | 10 min')"])
    instructionsSheet.addRow(["5. Problems: one problem per line. Format: 'Problem | Level' (Level: L1/L2/L3)"])
    instructionsSheet.addRow(["6. Score Category: must be one of: classwork, unit_test, project, homework, mid_semester, final_semester"])
    instructionsSheet.addRow(["7. Max Score: default 100, set the maximum score for this week's assessment."])
    instructionsSheet.addRow(["8. Media Links: comma-separated YouTube URLs or resource links."])
    instructionsSheet.addRow(["9. Save as XLSX and upload to Syllabus Manager > Upload > Excel/CSV tab."])
    instructionsSheet.addRow([])
    instructionsSheet.addRow(["Required fields: Week, Topic, Score Category, Max Score"])
    instructionsSheet.getRow(1).font = { bold: true, size: 12 }

    const buf = await wb.xlsx.writeBuffer()

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${subject}-Grade${grade}-Syllabus-Template.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Template generation failed" },
      { status: 500 },
    )
  }
}
