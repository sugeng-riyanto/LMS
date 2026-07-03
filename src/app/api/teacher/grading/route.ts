import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const pkgId = searchParams.get("package_id")
    const studentId = searchParams.get("student_id")
    const grade = searchParams.get("grade")
    const status = searchParams.get("status")
    const week = searchParams.get("week")

    let query = (supabase.from("student_work") as any)
      .select("*, student:student_id(id, full_name, email, grade_assigned)")

    if (pkgId) query = query.eq("package_id", pkgId)
    if (studentId) query = query.eq("student_id", studentId)
    if (status && status !== "all") query = query.eq("status", status)

    // If grade filter, first get student IDs for that grade
    if (grade) {
      const { data: students } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "student")
        .eq("grade_assigned", parseInt(grade))

      const ids = (students ?? []).map((s: any) => s.id)
      if (ids.length > 0) query = query.in("student_id", ids)
      else return NextResponse.json([])
    }

    query = query.order("submitted_at", { ascending: false })

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
