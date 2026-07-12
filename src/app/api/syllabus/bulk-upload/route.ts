import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"
import { SUBJECTS, GRADES } from "@/lib/utils/constants"
import ExcelJS from "exceljs"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const subject = (formData.get("subject") as string) || "PHY"
    const grade = parseInt((formData.get("grade") as string) || "10")

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }
    if (!GRADES.includes(grade as any)) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 })
    }
    if (!SUBJECTS.find(s => s.code === subject)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 })
    }

    const arrayBuf = await file.arrayBuffer()
    const rows: Record<string, string>[] = []

    if (file.name.endsWith(".xlsx")) {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.load(arrayBuf)
      const ws = wb.worksheets[0]
      if (!ws) return NextResponse.json({ error: "No worksheet found in file" }, { status: 400 })

      const headerRow = ws.getRow(1)
      const headers: string[] = []
      headerRow.eachCell(cell => headers.push((cell.value || "").toString().trim().toLowerCase()))

      const weekIdx = headers.findIndex(h => h === "week")
      const topicIdx = headers.findIndex(h => h.includes("topic"))
      const subtopicIdx = headers.findIndex(h => h.includes("subtopic"))
      const openingIdx = headers.findIndex(h => h.includes("opening"))
      const questionsIdx = headers.findIndex(h => h.includes("question"))
      const problemsIdx = headers.findIndex(h => h.includes("problem"))
      const catIdx = headers.findIndex(h => h.includes("score") || h.includes("category"))
      const maxScoreIdx = headers.findIndex(h => h.includes("max") && h.includes("score"))
      const mediaIdx = headers.findIndex(h => h.includes("media"))
      const objectivesIdx = headers.findIndex(h => h.includes("objective"))
      const milestoneIdx = headers.findIndex(h => h.includes("milestone"))
      const reflectionIdx = headers.findIndex(h => h.includes("reflection"))

      if (weekIdx === -1 || topicIdx === -1) {
        return NextResponse.json({ error: "Template must have 'Week' and 'Topic' columns" }, { status: 400 })
      }

      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const weekVal = row.getCell(weekIdx + 1).value
        const topicVal = row.getCell(topicIdx + 1).value
        if (!weekVal || !topicVal) return

        const rowData: Record<string, string> = {
          week: String(weekVal).trim(),
          topic: String(topicVal).trim(),
          subtopics: subtopicIdx >= 0 ? String(row.getCell(subtopicIdx + 1).value || "").trim() : "",
          opening_ideas: openingIdx >= 0 ? String(row.getCell(openingIdx + 1).value || "").trim() : "",
          activity_questions: questionsIdx >= 0 ? String(row.getCell(questionsIdx + 1).value || "").trim() : "",
          problems: problemsIdx >= 0 ? String(row.getCell(problemsIdx + 1).value || "").trim() : "",
          score_category: catIdx >= 0 ? String(row.getCell(catIdx + 1).value || "classwork").trim() : "classwork",
          max_score: maxScoreIdx >= 0 ? String(row.getCell(maxScoreIdx + 1).value || "100").trim() : "100",
          media_links: mediaIdx >= 0 ? String(row.getCell(mediaIdx + 1).value || "").trim() : "",
          objectives: objectivesIdx >= 0 ? String(row.getCell(objectivesIdx + 1).value || "").trim() : "",
          milestone: milestoneIdx >= 0 ? String(row.getCell(milestoneIdx + 1).value || "").trim() : "",
          reflection: reflectionIdx >= 0 ? String(row.getCell(reflectionIdx + 1).value || "").trim() : "",
        }
        rows.push(rowData)
      })
    } else if (file.name.endsWith(".csv")) {
      const text = new TextDecoder("utf-8").decode(arrayBuf)
      const lines = text.split("\n").filter(l => l.trim())
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 })
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ""))
      const weekIdx = headers.findIndex(h => h === "week")
      const topicIdx = headers.findIndex(h => h.includes("topic"))
      const subtopicIdx = headers.findIndex(h => h.includes("subtopic"))
      const openingIdx = headers.findIndex(h => h.includes("opening"))
      const questionsIdx = headers.findIndex(h => h.includes("question"))
      const problemsIdx = headers.findIndex(h => h.includes("problem"))
      const catIdx = headers.findIndex(h => h.includes("score") || h.includes("category"))
      const maxScoreIdx = headers.findIndex(h => h.includes("max") && h.includes("score"))
      const mediaIdx = headers.findIndex(h => h.includes("media"))
      const objectivesIdx = headers.findIndex(h => h.includes("objective"))
      const milestoneIdx = headers.findIndex(h => h.includes("milestone"))
      const reflectionIdx = headers.findIndex(h => h.includes("reflection"))

      if (weekIdx === -1 || topicIdx === -1) {
        return NextResponse.json({ error: "CSV must have 'Week' and 'Topic' columns" }, { status: 400 })
      }

      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""))
        const weekVal = vals[weekIdx]
        const topicVal = vals[topicIdx]
        if (!weekVal || !topicVal) continue

        const rowData: Record<string, string> = {
          week: weekVal,
          topic: topicVal,
          subtopics: subtopicIdx >= 0 ? vals[subtopicIdx] || "" : "",
          opening_ideas: openingIdx >= 0 ? vals[openingIdx] || "" : "",
          activity_questions: questionsIdx >= 0 ? vals[questionsIdx] || "" : "",
          problems: problemsIdx >= 0 ? vals[problemsIdx] || "" : "",
          score_category: catIdx >= 0 ? vals[catIdx] || "classwork" : "classwork",
          max_score: maxScoreIdx >= 0 ? vals[maxScoreIdx] || "100" : "100",
          media_links: mediaIdx >= 0 ? vals[mediaIdx] || "" : "",
          objectives: objectivesIdx >= 0 ? vals[objectivesIdx] || "" : "",
          milestone: milestoneIdx >= 0 ? vals[milestoneIdx] || "" : "",
          reflection: reflectionIdx >= 0 ? vals[reflectionIdx] || "" : "",
        }
        rows.push(rowData)
      }
    } else {
      return NextResponse.json({ error: "Unsupported format. Use .xlsx or .csv" }, { status: 400 })
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in file" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const validCategories = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    let saved = 0
    let errors = 0
    let lastError = ""

    for (const row of rows) {
      const weekVal = row.week.replace(/\*\*/g, "").replace(/[*_~`]/g, "").trim()
      const weekNum = parseInt(weekVal)
      if (isNaN(weekNum) || weekNum < 1 || weekNum > 43) { errors++; lastError = `Invalid week: "${row.week}"`; continue }

      const cat = validCategories.includes(row.score_category) ? row.score_category : "classwork"
      const maxScore = Math.max(1, parseInt(row.max_score) || 100)

      const questions = row.activity_questions
        ? row.activity_questions.split("\n").filter(q => q.trim()).map(q => {
            const parts = q.split("|").map(p => p.trim())
            return { question: parts[0], bloom: parts[1] || "remember", timing: parts[2] || "10 min" }
          })
        : []

      const problems = row.problems
        ? row.problems.split("\n").filter(p => p.trim()).map(p => {
            const parts = p.split("|").map(p => p.trim())
            return { problem: parts[0], level: parts[1] || "L1" }
          })
        : []

      const mediaLinks = row.media_links
        ? row.media_links.split(",").filter(l => l.trim()).map(url => ({ type: "link", url: url.trim(), title: "" }))
        : []

      const { error } = await (supabase.from("syllabus_planning") as any).upsert({
        academic_year: "2026-2027",
        grade,
        week_number: weekNum,
        subject,
        topic: row.topic,
        subtopics: row.subtopics ? row.subtopics.split(",").map(s => s.trim()).filter(Boolean) : [],
        opening_ideas: row.opening_ideas || null,
        activity_questions: questions,
        problems,
        media_links: mediaLinks,
        score_category: cat,
        max_score: maxScore,
        calendar_status: "normal",
        effective_days: 5,
        status: "planned",
        published: false,
        objectives: row.objectives || null,
        milestone: row.milestone || null,
        reflection: row.reflection || null,
      }, {
        onConflict: "academic_year,grade,week_number,subject",
        ignoreDuplicates: false,
      })

      if (!error) saved++
      else { errors++; lastError = error.message || String(error) }
    }

    // Also save objectives to syllabus_topics (one entry per unique topic)
    const topicMap = new Map<string, { topic: string; objectives: string[]; weeks: number[]; subtopics: string[] }>()
    for (const row of rows) {
      const weekVal = row.week.replace(/\*\*/g, "").replace(/[*_~`]/g, "").trim()
      const weekNum = parseInt(weekVal)
      if (isNaN(weekNum)) continue
      const key = row.topic.trim().toLowerCase()
      if (!key) continue
      if (!topicMap.has(key)) {
        topicMap.set(key, { topic: row.topic.trim(), objectives: [], weeks: [], subtopics: [] })
      }
      const entry = topicMap.get(key)!
      entry.weeks.push(weekNum)
      if (row.objectives) {
        entry.objectives.push(row.objectives)
      }
      if (row.subtopics) {
        row.subtopics.split(",").map(s => s.trim()).filter(Boolean).forEach(s => {
          if (!entry.subtopics.includes(s)) entry.subtopics.push(s)
        })
      }
    }

    const curriculum = grade <= 8 ? "Cambridge Checkpoint" : grade <= 10 ? "Cambridge IGCSE" : "Cambridge AS/A Level"
    let topicsSaved = 0
    for (const [, entry] of topicMap) {
      const unitId = entry.topic.toLowerCase().replace(/[\s:,.']+/g, "-").replace(/[^a-z0-9-]/g, "")
      const allObjectives = entry.objectives
        .flatMap(o => o.split("\n").filter(Boolean).map(l => l.replace(/^[\s•\-\d.]+/, "").trim()))
        .filter(Boolean)

      const { error: topicErr } = await (supabase.from("syllabus_topics") as any).upsert({
        grade,
        subject,
        unit_id: unitId,
        topic: entry.topic,
        subtopics: entry.subtopics,
        syllabus_ref: curriculum,
        curriculum,
        suggested_weeks: entry.weeks,
      }, {
        onConflict: "grade,unit_id,subject",
        ignoreDuplicates: false,
      })
      if (!topicErr) topicsSaved++

      // If objectives exist, save/update to syllabus_objectives
      if (allObjectives.length > 0) {
        await (supabase.from("syllabus_objectives") as any).upsert({
          grade,
          unit_id: unitId,
          topic: entry.topic,
          objectives: allObjectives,
          syllabus_ref: curriculum,
          curriculum,
        }, {
          onConflict: "grade,unit_id",
          ignoreDuplicates: false,
        })
      }
    }

    return NextResponse.json({
      message: `Saved ${saved} of ${rows.length} weeks${errors > 0 ? ` (${errors} errors${lastError ? `: ${lastError}` : ""})` : ""}${topicsSaved > 0 ? ` + ${topicsSaved} topics to syllabus` : ""}`,
      saved,
      total: rows.length,
      errors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk upload failed" },
      { status: 500 },
    )
  }
}
