import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get("teacher_id")
    const gradeFilter = searchParams.get("grade")

    let query = (supabase as any)
      .from("teacher_assignments")
      .select("*, classes:class_id(id, grade, class_name), profiles:teacher_id(id, full_name, email)")

    if (teacherId) query = query.eq("teacher_id", teacherId)
    if (gradeFilter) query = query.eq("grade", parseInt(gradeFilter))

    query = query.order("grade").order("subject")

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

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const { teacher_id, grade, subject, class_id } = body

    if (!teacher_id || !grade || !subject) {
      return NextResponse.json({ error: "teacher_id, grade, and subject are required" }, { status: 400 })
    }

    const { data, error } = await (supabase as any)
      .from("teacher_assignments")
      .insert({ teacher_id, grade, subject, class_id: class_id || null })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This assignment already exists." }, { status: 409 })
      }
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
