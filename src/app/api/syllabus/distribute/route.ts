import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"
import { distributeTopics, type ParsedTopic } from "@/lib/syllabus/parser"

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const { topics, subject, grade, curriculum } = body as {
      topics: ParsedTopic[]
      subject: string
      grade: number
      curriculum: string
    }

    if (!topics?.length || !subject || !grade) {
      return NextResponse.json({ error: "topics, subject, and grade are required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const distribution = distributeTopics(topics)
    const saved: { unitId: string; topic: string }[] = []

    for (const topic of topics) {
      const unitId = topic.unitId || topic.topic.toLowerCase().replace(/[\s.]+/g, "-").replace(/[^a-z0-9-]/g, "")

      const { error: insertError } = await (admin.from("syllabus_topics") as any).insert({
        grade,
        unit_id: unitId,
        topic: topic.topic,
        subtopics: topic.subtopics,
        syllabus_ref: curriculum,
        curriculum: curriculum.toLowerCase().includes("cambridge") ? "cambridge" : "tka",
        suggested_weeks: distribution.filter(d => d.unitId === unitId).map(d => d.week),
      })

      if (insertError) {
        if (!insertError.message?.includes("duplicate")) {
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }
      } else {
        saved.push({ unitId, topic: topic.topic })
      }
    }

    return NextResponse.json({
      saved: saved.length,
      distribution,
      message: `${saved.length} topics saved and distributed across ${new Set(distribution.map(d => d.week)).size} weeks`,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Distribution failed" },
      { status: 500 },
    )
  }
}
