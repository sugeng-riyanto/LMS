import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null }

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const week = searchParams.get("week")

    let query = (supabase.from("academic_calendars") as any).select("*").order("start_date")

    // Super admin sees all events; others see global events + their own
    if (profile?.role !== "super_admin") {
      query = query.or(`created_by.is.null,created_by.eq.${user.id}`)
    }

    if (grade) query = query.contains("affected_grades", [parseInt(grade)])
    if (week) query = query.eq("week_number", parseInt(week))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []) as Array<Record<string, unknown>>
    const normalized = rows.map((r) => ({
      id: r.id,
      title: r.event_name ?? "",
      description: (r.notes as string) ?? "",
      date: (r.start_date as string) ?? "",
      type: (r.event_type as string) ?? "normal",
      grade: ((r.affected_grades as number[])?.[0]) ?? null,
      affected_grades: (r.affected_grades as number[]) ?? [],
      personal: r.personal ?? false,
      created_by: r.created_by ?? null,
      ...r,
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student", "principal"])
    if (authError) return authError

    const body = await request.json()
    const isAdmin = profile.role === "super_admin"
    const personal = body.personal && !isAdmin ? true : (body.personal ?? false)

    // Get grade_assigned for non-admin users
    let gradeAssigned = 10
    if (!isAdmin) {
      const { data: p } = await (supabase.from("profiles") as any)
        .select("grade_assigned").eq("id", user.id).single()
      gradeAssigned = p?.grade_assigned || 10
    }

    const { data, error } = await (supabase
      .from("academic_calendars") as any)
      .insert({
        academic_year: body.academic_year ?? "2026-2027",
        semester: body.semester,
        month: body.month,
        week_number: body.week_number,
        start_date: body.start_date,
        end_date: body.end_date,
        effective_days: body.effective_days ?? 5,
        event_name: body.event_name ?? null,
        event_type: body.event_type ?? "normal",
        affected_grades: isAdmin ? (body.affected_grades ?? [7, 8, 9, 10, 11, 12]) : [gradeAssigned],
        is_holiday: body.is_holiday ?? false,
        notes: body.notes ?? null,
        created_by: isAdmin ? null : user.id,
        personal: !isAdmin ? true : (body.personal ?? false),
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
