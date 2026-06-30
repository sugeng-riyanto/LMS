import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const semester = searchParams.get("semester")

    if (!grade) {
      return NextResponse.json({ error: "grade query parameter is required" }, { status: 400 })
    }

    let query = supabase
      .from("weekly_packages")
      .select("*")
      .eq("grade", parseInt(grade))

    if (semester) {
      query = query.eq("semester", parseInt(semester))
    }

    query = query.order("week_number")

    const { data: packages, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: "XLSX export placeholder",
      grade: parseInt(grade),
      semester: semester ? parseInt(semester) : null,
      total_packages: packages.length,
      packages: packages.map((p: any) => ({
        id: p.id,
        week_number: p.week_number,
        topic: p.topic,
        status: p.status,
        effective_days: p.effective_days,
        has_lesson_plan: p.lesson_plan !== null,
        has_worksheet: p.worksheet !== null,
        has_pre_class: p.pre_class !== null,
        has_lab_logistics: p.lab_logistics !== null,
        has_answer_keys: p.answer_keys !== null,
      })),
      export_format: "xlsx",
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
