import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    const validCats = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    if (body.score_category && !validCats.includes(body.score_category)) {
      return NextResponse.json({ error: "Invalid score_category" }, { status: 400 })
    }

    const allowedFields = [
      "topic", "subtopics", "syllabus_ref",
      "opening_ideas", "activity_questions", "problems",
      "calendar_status", "effective_days", "status",
      "score_category", "max_score", "published",
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("syllabus_planning") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params

    const { error } = await (supabase.from("syllabus_planning") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: "Syllabus plan deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
