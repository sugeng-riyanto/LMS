import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { parseSyllabusText, distributeTopics } from "@/lib/syllabus/parser"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const contentText = formData.get("content") as string | null
    const subject = (formData.get("subject") as string) || "PHY"
    const grade = parseInt((formData.get("grade") as string) || "10")

    let textToParse = ""

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      if (file.name.endsWith(".md") || file.type.includes("text") || file.name.endsWith(".txt")) {
        textToParse = buffer.toString("utf-8")
      } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        return NextResponse.json({ error: "PDF parsing requires server-side pdf-parse library. Please convert to markdown first or paste the syllabus text." }, { status: 400 })
      } else {
        textToParse = buffer.toString("utf-8")
      }
    } else if (contentText) {
      textToParse = contentText
    } else {
      return NextResponse.json({ error: "Provide file or content field" }, { status: 400 })
    }

    const result = parseSyllabusText(textToParse, subject, grade)
    const distribution = distributeTopics(result.topics)

    return NextResponse.json({
      topics: result.topics,
      curriculum: result.curriculum,
      distribution,
      topicCount: result.topics.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Parse failed" },
      { status: 500 },
    )
  }
}
