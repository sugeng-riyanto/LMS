import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from("subjects") as any)
      .update({ code: body.code, name: body.name, icon: body.icon, is_active: body.is_active, sort_order: body.sort_order })
      .eq("id", id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await (supabase.from("subjects") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
