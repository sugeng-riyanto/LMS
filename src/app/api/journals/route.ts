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
    const studentId = searchParams.get("student_id")
    const grade = searchParams.get("grade")

    let query = (supabase.from("mistake_journals") as any).select("*")

    if (profile?.role === "student") {
      query = query.eq("student_id", user.id)
    } else {
      if (studentId) query = query.eq("student_id", studentId)
      if (grade) query = query.eq("grade", parseInt(grade))
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
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const body = await request.json()
    const studentId = user.role === "student" ? user.id : (body.student_id ?? user.id)
    const canGiveFeedback = user.role === "super_admin" || user.role === "teacher"

    const { data, error } = await (supabase
      .from("mistake_journals") as any)
      .insert({
        student_id: studentId,
        grade: body.grade,
        topic: body.topic,
        mistake_description: body.mistake_description,
        root_cause: body.root_cause ?? null,
        correct_approach: body.correct_approach ?? null,
        law_or_principle: body.law_or_principle ?? null,
        related_package_id: body.related_package_id ?? null,
        teacher_feedback: canGiveFeedback ? (body.teacher_feedback ?? null) : null,
      })
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
