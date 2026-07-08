import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseSyllabusText, distributeTopics, type ParsedTopic } from "@/lib/syllabus/parser"
import { pdfToText } from "@/lib/syllabus/pdf-to-text"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const contentText = formData.get("content") as string | null
    const subject = (formData.get("subject") as string) || "PHY"
    const grade = parseInt((formData.get("grade") as string) || "10")
    const autoDistribute = formData.get("distribute") === "true"

    let textToParse = ""
    let sourceType = ""

    if (file) {
      if (file.name.endsWith(".md") || file.type.includes("markdown") || file.name.endsWith(".txt") || file.type === "text/plain") {
        textToParse = Buffer.from(await file.arrayBuffer()).toString("utf-8")
        sourceType = "markdown"
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const buffer = await file.arrayBuffer()
        textToParse = await pdfToText(buffer)
        sourceType = "pdf"
      } else {
        return NextResponse.json({ error: "Unsupported file type. Use .md (markdown) or .pdf" }, { status: 400 })
      }
    } else if (contentText) {
      textToParse = contentText
      sourceType = "text"
    } else {
      return NextResponse.json({ error: "Upload a file (.md or .pdf) or paste content" }, { status: 400 })
    }

    const result = parseSyllabusText(textToParse, subject, grade)
    const distribution = distributeTopics(result.topics)

    if (autoDistribute && result.topics.length > 0) {
      const admin = createAdminClient()
      let saved = 0
      for (const topic of result.topics) {
        const unitId = topic.unitId || topic.topic.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, "")
        const { error: insertError } = await (admin.from("syllabus_topics") as any).insert({
          grade,
          unit_id: unitId,
          topic: topic.topic,
          subtopics: topic.subtopics,
          syllabus_ref: result.curriculum,
          curriculum: result.curriculum.toLowerCase().includes("cambridge") ? "cambridge" : "tka",
          suggested_weeks: distribution.filter(d => d.unitId === unitId).map(d => d.week),
        }).single()
        if (!insertError || insertError.message?.includes("duplicate")) saved++
      }

      return NextResponse.json({
        sourceType,
        curriculum: result.curriculum,
        topicCount: result.topics.length,
        topics: result.topics,
        distribution,
        saved,
        message: `Parsed ${result.topics.length} topics, saved ${saved} to database, distributed across ${new Set(distribution.map(d => d.week)).size} weeks`,
      })
    }

    return NextResponse.json({
      sourceType,
      curriculum: result.curriculum,
      topicCount: result.topics.length,
      topics: result.topics,
      distribution,
      message: `Found ${result.topics.length} topics from ${result.curriculum} (${sourceType})`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    )
  }
}
