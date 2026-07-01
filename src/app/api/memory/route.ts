import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const week = searchParams.get("week")
    const academicYear = searchParams.get("academic_year")

    let query = (supabase.from("class_memory") as any).select("*")

    if (grade) {
      query = query.eq("grade", parseInt(grade))
    }
    if (week) {
      query = query.eq("week_number", parseInt(week))
    }
    if (academicYear) {
      query = query.eq("academic_year", academicYear)
    }

    query = query.order("created_at", { ascending: false })

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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

    const allowed = ["academic_year", "grade", "week_number", "topic_taught", "misconceptions", "average_classwork_score", "students_struggling", "students_advanced", "lab_equipment_status", "notes_for_next_week"]
    const sanitized: Record<string, unknown> = { created_by: user.id }
    for (const field of allowed) {
      if (body[field] !== undefined) sanitized[field] = body[field]
    }

    const { data, error } = await (supabase
      .from("class_memory") as any)
      .insert(sanitized)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
