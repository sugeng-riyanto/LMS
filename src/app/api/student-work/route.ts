import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pkgId = searchParams.get("package_id")
    const questionId = searchParams.get("question_id")
    const status = searchParams.get("status")
    const worksheetId = searchParams.get("worksheet_id")
    const syllabusId = searchParams.get("syllabus_id")
    const studentName = searchParams.get("student_name")
    const grade = searchParams.get("grade")

    // Support unauthenticated lookup by student_name + grade (for public pages)
    if (studentName && grade) {
      const admin = createAdminClient()
      const { data: profile } = await (admin.from("profiles") as any)
        .select("id")
        .eq("role", "student")
        .eq("full_name", studentName)
        .eq("grade_assigned", parseInt(grade))
        .maybeSingle()
      if (!profile) return NextResponse.json([])

      let q = (admin.from("student_work") as any).select("*").eq("student_id", profile.id)
      if (worksheetId) q = q.eq("worksheet_id", worksheetId)
      if (syllabusId) q = q.eq("syllabus_id", syllabusId)
      if (status) q = q.eq("status", status)
      const { data } = await q.order("submitted_at", { ascending: false })
      return NextResponse.json(data ?? [])
    }

    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student", "principal"])
    if (authError) return authError

    let query = (supabase.from("student_work") as any).select("*")
    if (user.role === "student") query = query.eq("student_id", user.id)

    if (pkgId) query = query.eq("package_id", pkgId)
    if (questionId) query = query.eq("question_id", questionId)
    if (status && status !== "all") query = query.eq("status", status)
    if (worksheetId) query = query.eq("worksheet_id", worksheetId)
    if (syllabusId) query = query.eq("syllabus_id", syllabusId)

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

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["student"])
    if (authError) return authError

    const body = await request.json()
    if (!body.question_id) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("student_work") as any)
      .insert({
        student_id: user.id,
        package_id: body.package_id ?? null,
        question_id: body.question_id,
        question_text: body.question_text ?? "",
        question_type: body.question_type ?? "paragraph",
        answer_text: body.answer_text ?? null,
        canvas_data: body.canvas_data ?? null,
        max_score: body.max_score ?? 10,
        status: "submitted",
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
