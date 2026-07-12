import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const week = searchParams.get("week")
    const subject = searchParams.get("subject")

    let query = (ADMIN().from("syllabus_planning") as any).select("*").order("week_number")

    if (grade) query = query.eq("grade", parseInt(grade))
    if (week) query = query.eq("week_number", parseInt(week))
    if (subject) query = query.eq("subject", subject)
    // Teachers can only see their own subject's plans
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (subjects.length > 0) query = query.in("subject", subjects)
    }

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
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const { grade, week_number, topic, subtopics, syllabus_ref, opening_ideas, activity_questions, problems, calendar_status, effective_days, objectives, evaluation, milestone, reflection } = body

    if (!grade || !week_number || !topic) {
      return NextResponse.json({ error: "grade, week_number, and topic are required" }, { status: 400 })
    }

    // Teachers can only create plans for their own subjects
    if (profile?.role === "teacher" && body.subject) {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (!subjects.includes(body.subject)) {
        return NextResponse.json({ error: "You can only create plans for your assigned subjects" }, { status: 403 })
      }
    }

    const validCats = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    if (body.score_category && !validCats.includes(body.score_category)) {
      return NextResponse.json({ error: "Invalid score_category" }, { status: 400 })
    }

    const { data, error } = await (ADMIN().from("syllabus_planning") as any)
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
        score_category: body.score_category ?? null,
        max_score: body.max_score ?? 100,
        subject: body.subject ?? "PHY",
        published: body.published ?? false,
        created_by: user.id,
        objectives: objectives ?? null,
        evaluation: evaluation ?? {},
        milestone: milestone ?? null,
        reflection: reflection ?? null,
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
