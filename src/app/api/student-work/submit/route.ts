import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    // Try authenticated user first
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { worksheet_id, syllabus_id, entries, student_name, grade } = body

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries array is required" }, { status: 400 })
    }

    if (!worksheet_id && !syllabus_id) {
      return NextResponse.json({ error: "worksheet_id or syllabus_id required" }, { status: 400 })
    }

    // Resolve student
    let studentId = user?.id
    if (!studentId) {
      if (!student_name) {
        return NextResponse.json({ error: "student_name required (not authenticated)" }, { status: 401 })
      }
      const admin = createAdminClient()
      const { data: profile } = await (admin.from("profiles") as any)
        .select("id")
        .eq("role", "student")
        .eq("full_name", student_name)
        .eq("grade_assigned", grade ?? 0)
        .maybeSingle()
      if (!profile) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 })
      }
      studentId = profile.id
    }

    const admin = createAdminClient()
    const results = []

    // Determine subject from source
    let subject: string | null = null
    if (worksheet_id) {
      const { data: ws } = await (admin.from("shared_worksheets") as any).select("subject").eq("id", worksheet_id).single()
      subject = ws?.subject ?? "PHY"
    } else if (syllabus_id) {
      const { data: sp } = await (admin.from("syllabus_planning") as any).select("subject").eq("id", syllabus_id).single()
      subject = sp?.subject ?? "PHY"
    }

    for (const entry of entries) {
      const record: Record<string, unknown> = {
        student_id: studentId,
        question_id: entry.question_id,
        question_text: entry.question_text ?? "",
        question_type: entry.question_type ?? "paragraph",
        answer_text: entry.answer_text ?? null,
        canvas_data: entry.canvas_data ?? null,
        max_score: entry.max_score ?? 10,
        subject,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      }
      if (worksheet_id) record.worksheet_id = worksheet_id
      if (syllabus_id) record.syllabus_id = syllabus_id

      const { data, error } = await (admin.from("student_work") as any)
        .insert(record)
        .select()
        .single()

      if (error) {
        // Try upsert by question_id + student_id + worksheet/syllabus
        const { data: upserted } = await (admin.from("student_work") as any)
          .update(record)
          .eq("student_id", studentId)
          .eq("question_id", entry.question_id)
          .eq(worksheet_id ? "worksheet_id" : "syllabus_id", worksheet_id || syllabus_id)
          .select()
          .maybeSingle()
        if (upserted) results.push(upserted)
        continue
      }
      results.push(data)
    }

    return NextResponse.json({ submitted: results.length, entries: results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
