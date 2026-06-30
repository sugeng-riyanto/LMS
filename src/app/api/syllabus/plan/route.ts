import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const week = searchParams.get("week")

    let query = (supabase.from("syllabus_planning") as any).select("*").order("week_number")

    if (grade) query = query.eq("grade", parseInt(grade))
    if (week) query = query.eq("week_number", parseInt(week))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const { grade, week_number, topic, subtopics, syllabus_ref, opening_ideas, activity_questions, problems, calendar_status, effective_days } = body

    if (!grade || !week_number || !topic) {
      return NextResponse.json({ error: "grade, week_number, and topic are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("syllabus_planning") as any)
      .upsert({
        academic_year: body.academic_year ?? "2026-2027",
        grade,
        week_number,
        topic,
        subtopics: subtopics ?? [],
        syllabus_ref: syllabus_ref ?? null,
        opening_ideas: opening_ideas ?? null,
        activity_questions: activity_questions ?? [],
        problems: problems ?? [],
        calendar_status: calendar_status ?? "normal",
        effective_days: effective_days ?? 5,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
