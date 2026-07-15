import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const { data: existing } = await (supabase.from("student_work") as any)
      .select("student_id")
      .eq("id", id)
      .single()

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (existing.student_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const allowed = ["answer_text", "canvas_data", "question_type", "status"]
    const updates: Record<string, unknown> = {}
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data: existing } = await (supabase.from("student_work") as any)
      .select("student_id")
      .eq("id", id)
      .single()

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (existing.student_id !== user.id) {
      const { requireRole } = await import("@/lib/supabase/require-role")
      const { error: authError } = await requireRole(["super_admin"])
      if (authError) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error } = await (supabase.from("student_work") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
