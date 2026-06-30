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
      .select("role, grade_assigned")
      .eq("id", user.id)
      .single() as { data: { role: string; grade_assigned: number | null } | null }

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const week = searchParams.get("week")
    const status = searchParams.get("status")

    let query = (supabase.from("weekly_packages") as any).select("*")

    if (profile?.role === "student") {
      query = query.eq("status", "published")
      if (profile.grade_assigned) {
        query = query.eq("grade", profile.grade_assigned)
      }
    }
    if (profile?.role === "lab_assistant") {
      query = query.select("id, grade, week_number, topic, lab_logistics, status, calendar_status")
    }
    if (grade && profile?.role !== "student") {
      query = query.eq("grade", parseInt(grade))
    }
    if (week) {
      query = query.eq("week_number", parseInt(week))
    }
    if (status && profile?.role !== "student") {
      query = query.eq("status", status)
    }

    query = query.order("grade").order("week_number")

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const normalized = (data ?? []).map((r: Record<string, unknown>) => ({
      ...r,
      title: r.topic ?? "",
      week: r.week_number,
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
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const academic_year = body.academic_year ?? "2026-2027"
    const grade_val = body.grade ?? body.grade_val
    const week_number = body.week_number ?? body.week
    const topic = body.topic ?? body.title
    const created_by = user.id

    if (grade_val === undefined || week_number === undefined) {
      return NextResponse.json(
        { error: "grade and week_number/week are required" },
        { status: 400 }
      )
    }

    const semester = week_number <= 26 ? 1 : 2

    const { data, error } = await (supabase
      .from("weekly_packages") as any)
      .insert({ academic_year, grade: grade_val, week_number, semester, topic })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const row = data as Record<string, unknown> | null
    const normalized = row ? { ...row, title: row.topic ?? "", week: row.week_number } : row

    return NextResponse.json(normalized, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
