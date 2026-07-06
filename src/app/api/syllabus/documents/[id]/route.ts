import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const allowed = ["published", "file_name", "file_type", "score_category"]

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("syllabus_documents") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError
    const { id } = await params
    const { error } = await (supabase.from("syllabus_documents") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
