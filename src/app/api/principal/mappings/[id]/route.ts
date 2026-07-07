import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const { id } = await params
    try {
      const { error } = await (supabase.from("principal_teacher_mappings") as any).delete().eq("id", id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ message: "Deleted" })
    } catch {
      return NextResponse.json({ error: "Table not available" }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
