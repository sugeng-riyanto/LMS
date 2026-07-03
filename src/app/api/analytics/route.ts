import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")

    let query = supabase.from("student_performance").select("*")

    if (grade && grade !== "all") {
      query = query.eq("grade_assigned", parseInt(grade))
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const summary = {
      total_students: data.length,
      average_accuracy: data.length
        ? data.reduce((sum, r) => sum + ((r as any).entry_ticket_accuracy ?? 0), 0) / data.length
        : 0,
      total_journal_entries: data.reduce((sum, r) => sum + ((r as any).total_journal_entries ?? 0), 0),
      total_packages_attempted: data.reduce((sum, r) => sum + ((r as any).packages_attempted ?? 0), 0),
      students: data,
    }

    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
