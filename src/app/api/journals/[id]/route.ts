import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const { data, error } = await supabase
      .from("mistake_journals")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return NextResponse.json({ error: "Journal not found" }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const entry = data as { student_id: string } | null
    if (entry && entry.student_id !== user.id) {
      const result = await requireRole(["super_admin", "teacher"])
      if (result.error) return result.error
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    if (user.role === "student") {
      const { data: entry } = await supabase
        .from("mistake_journals")
        .select("student_id")
        .eq("id", id)
        .single() as { data: { student_id: string } | null }

      if (!entry || entry.student_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const allowedFields = user.role === "super_admin" || user.role === "teacher"
      ? ["mistake_description", "root_cause", "correct_approach", "law_or_principle", "teacher_feedback", "topic", "grade", "subject"]
      : ["mistake_description", "root_cause", "correct_approach", "law_or_principle", "subject"]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await (supabase.from("mistake_journals") as any)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "student"])
    if (authError) return authError

    const { id } = await params

    if (user.role === "student") {
      const { data: entry } = await supabase
        .from("mistake_journals")
        .select("student_id")
        .eq("id", id)
        .single() as { data: { student_id: string } | null }

      if (!entry || entry.student_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { error } = await (supabase.from("mistake_journals") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: "Journal entry deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
