import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get("package_id")

    let query = (supabase.from("entry_ticket_responses") as any).select("*")

    if (user.role === "student") {
      query = query.eq("student_id", user.id)
    }
    if (packageId) {
      query = query.eq("package_id", packageId)
    }

    const { data, error } = await query.order("submitted_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
    const { supabase, user, error: authError } = await requireRole(["student"])
    if (authError) return authError

    const body = await request.json()
    const { package_id, answers, time_spent_seconds } = body

    if (!package_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "package_id and answers array are required" }, { status: 400 })
    }

    const records = answers.map((a: { question_id: string; student_answer: string; is_correct: boolean }) => ({
      student_id: user.id,
      package_id,
      question_id: a.question_id,
      student_answer: a.student_answer,
      is_correct: a.is_correct,
      time_spent_seconds: time_spent_seconds || null,
    }))

    const { error: insertError } = await (supabase
      .from("entry_ticket_responses") as any)
      .upsert(records, {
        onConflict: "student_id, package_id, question_id",
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
