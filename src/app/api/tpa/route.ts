import { NextRequest, NextResponse } from "next/server"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES, calculateTotal, getGradeLabel } from "@/tpa/rubric"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacher_id")
    const semester = searchParams.get("semester")

    let query = (supabase.from("teacher_performance_assessments") as any)
      .select("*, teacher:teacher_id(id, full_name), principal:principal_id(id, full_name)")
      .order("created_at", { ascending: false })

    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      query = query.eq("principal_id", user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      query = query.eq("teacher_id", user.id)
    }
    if (teacherId) query = query.eq("teacher_id", teacherId)
    if (semester) query = query.eq("semester", parseInt(semester))

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
    if (!body.teacher_id) {
      return NextResponse.json({ error: "teacher_id is required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("teacher_performance_assessments") as any)
      .insert({
        teacher_id: body.teacher_id,
        principal_id: user.id,
        academic_year: body.academic_year ?? "2026-2027",
        semester: body.semester ?? 1,
        subject: body.subject ?? null,
        grade: body.grade ?? null,
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
