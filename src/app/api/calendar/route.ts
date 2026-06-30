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

    let query = (supabase.from("academic_calendars") as any).select("*").order("start_date")

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
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()

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
        affected_grades: body.affected_grades ?? [7, 8, 9, 10, 11, 12],
        is_holiday: body.is_holiday ?? false,
        notes: body.notes ?? null,
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
