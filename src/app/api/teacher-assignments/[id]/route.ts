import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const { teacher_id, grade, subject, class_id } = body

    const updateData: Record<string, any> = {}
    if (teacher_id !== undefined) updateData.teacher_id = teacher_id
    if (grade !== undefined) updateData.grade = grade
    if (subject !== undefined) updateData.subject = subject
    if (class_id !== undefined) updateData.class_id = class_id || null

    const { data, error } = await (supabase as any)
      .from("teacher_assignments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This assignment already exists." }, { status: 409 })
      }
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { id } = await params
    const { error } = await (supabase as any).from("teacher_assignments").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
