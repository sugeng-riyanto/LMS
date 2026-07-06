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
    const periodType = searchParams.get("period_type")

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
    if (periodType) query = query.eq("period_type", periodType)

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

    const periodType = body.period_type ?? "semester"
    const periodLabel = body.period_label || getDefaultPeriodLabel(periodType, body.academic_year ?? "2026-2027", body.semester ?? 1)

    const { data, error } = await (supabase.from("teacher_performance_assessments") as any)
      .insert({
        teacher_id: body.teacher_id,
        principal_id: user.id,
        academic_year: body.academic_year ?? "2026-2027",
        semester: body.semester ?? 1,
        period_type: periodType,
        period_label: periodLabel,
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

function getDefaultPeriodLabel(type: string, year: string, semester: number): string {
  const now = new Date()
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  if (type === "monthly") return `${months[now.getMonth()]} ${now.getFullYear()}`
  if (type === "quarterly") return `Q${quarter} ${now.getFullYear()}`
  return `Semester ${semester} ${year}`
}
