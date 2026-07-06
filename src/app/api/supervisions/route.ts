import { NextRequest, NextResponse } from "next/server"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacher_id")

    let query = (supabase.from("supervisions") as any).select("*, principal:principal_id(id, full_name), teacher:teacher_id(id, full_name)").order("observation_date", { ascending: false })

    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      query = query.eq("principal_id", user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      query = query.eq("teacher_id", user.id)
    }
    if (teacherId) query = query.eq("teacher_id", teacherId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const body = await request.json()
    if (!body.teacher_id || !body.grade || !body.subject) {
      return NextResponse.json({ error: "teacher_id, grade, and subject are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("supervisions") as any)
      .insert({
        principal_id: user.id,
        teacher_id: body.teacher_id,
        grade: body.grade,
        subject: body.subject,
        class_name: body.class_name ?? null,
        observation_date: body.observation_date ?? new Date().toISOString().split("T")[0],
        teaching_quality_score: body.teaching_quality_score ?? null,
        classroom_management_score: body.classroom_management_score ?? null,
        student_engagement_score: body.student_engagement_score ?? null,
        notes: body.notes ?? null,
        strengths: body.strengths ?? null,
        areas_for_improvement: body.areas_for_improvement ?? null,
        status: "draft",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
