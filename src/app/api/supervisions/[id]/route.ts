import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { id } = await params
    const { data, error } = await (supabase.from("supervisions") as any)
      .select("*, principal:principal_id(id, full_name), teacher:teacher_id(id, full_name)")
      .eq("id", id)
      .single()

    if (error || !data) return new NextResponse("Not found", { status: 404 })
    // Check access
    if (profile.role !== "super_admin" && data.principal_id !== user.id && data.teacher_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }
    return NextResponse.json(data)
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Verify ownership for principal updates
    if (profile.role === "principal") {
      const { data: s } = await (supabase.from("supervisions") as any).select("principal_id").eq("id", id).single()
      if (!s || s.principal_id !== user.id) return new NextResponse("Forbidden", { status: 403 })
    }

    // Teachers can only sign/acknowledge
    if (profile.role === "teacher") {
      const { data: s } = await (supabase.from("supervisions") as any).select("teacher_id, status").eq("id", id).single()
      if (!s || s.teacher_id !== user.id || s.status !== "published") return new NextResponse("Forbidden", { status: 403 })
      const { data, error } = await (supabase.from("supervisions") as any)
        .update({ teacher_signature: body.teacher_signature, teacher_signed_at: new Date().toISOString(), status: "acknowledged" })
        .eq("id", id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    const allowed = ["teaching_quality_score", "classroom_management_score", "student_engagement_score", "notes", "strengths", "areas_for_improvement", "class_name", "observation_date"]
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]

    const { data, error } = await (supabase.from("supervisions") as any)
      .update(updates).eq("id", id).select().single()

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
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError
    const { id } = await params

    if (profile.role !== "super_admin") {
      const { data: s } = await (supabase.from("supervisions") as any).select("principal_id").eq("id", id).single()
      if (!s || s.principal_id !== user.id) return new NextResponse("Forbidden", { status: 403 })
    }

    const { error } = await (supabase.from("supervisions") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
