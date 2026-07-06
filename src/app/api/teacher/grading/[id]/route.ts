import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { callLLM } from "@/lib/agents/call-llm"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Teachers can only grade their own subject's work
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      const { data: work } = await (supabase.from("student_work") as any)
        .select("subject").eq("id", id).single()
      if (work && work.subject && !subjects.includes(work.subject)) {
        return NextResponse.json({ error: "You can only grade your own subject's submissions" }, { status: 403 })
      }
    }

    const updates: Record<string, unknown> = {
      score: body.score ?? null,
      feedback: body.feedback ?? null,
      teacher_annotation: body.teacher_annotation ?? null,
      teacher_id: user.id,
      status: "graded",
      graded_at: new Date().toISOString(),
    }

    const validCategories = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    if (body.score_category && validCategories.includes(body.score_category)) {
      updates.score_category = body.score_category
    }

    const { data, error } = await (supabase.from("student_work") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Teachers can only auto-grade their own subject's work
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      const { data: work } = await (supabase.from("student_work") as any)
        .select("subject").eq("id", id).single()
      if (work && work.subject && !subjects.includes(work.subject)) {
        return NextResponse.json({ error: "You can only grade your own subject's submissions" }, { status: 403 })
      }
    }

    // Get the student's answer
    const { data: work, error: fetchError } = await (supabase.from("student_work") as any)
      .select("*, student:student_id(id, full_name)")
      .eq("id", id)
      .single()

    if (fetchError || !work) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Auto-generate feedback and score using AI
    const systemPrompt = "You are an expert Cambridge Physics teacher assessing student work. Provide:\n1. A score out of 10\n2. Specific, constructive feedback in fluent English (IELTS 7.5)\n\nOutput JSON: {\"score\": number, \"feedback\": \"string\"}"
    const prompt = `Question: ${work.question_text}\n\nStudent answer: ${work.answer_text || "(canvas drawing submitted)"}\n\nAssess this answer.`

    let autoScore = body.score
    let autoFeedback = body.feedback

    try {
      const { content } = await callLLM(prompt, { systemPrompt, temperature: 0.3, maxTokens: 1024 })
      const cleaned = content.replace(/```json?\s*/gi, "").replace(/```/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (autoScore === undefined || autoScore === null) autoScore = parsed.score
      if (!autoFeedback) autoFeedback = parsed.feedback
    } catch {
      // AI failed — use provided values or defaults
      autoScore = autoScore ?? 5
      autoFeedback = autoFeedback ?? "Review the question and try again."
    }

    const validCategories = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    const updates: Record<string, unknown> = {
      score: Math.min(Math.max(autoScore, 0), work.max_score ?? 10),
      feedback: autoFeedback,
      teacher_annotation: body.teacher_annotation ?? null,
      teacher_id: user.id,
      status: "graded",
      graded_at: new Date().toISOString(),
    }
    if (body.score_category && validCategories.includes(body.score_category)) {
      updates.score_category = body.score_category
    }

    const { data, error } = await (supabase.from("student_work") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
