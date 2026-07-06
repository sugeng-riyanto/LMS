import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const { id } = await params

    if (profile.role !== "super_admin") {
      const { data: s } = await (supabase.from("supervisions") as any).select("principal_id, status").eq("id", id).single()
      if (!s || s.principal_id !== user.id) return new NextResponse("Forbidden", { status: 403 })
    }

    const { data, error } = await (supabase.from("supervisions") as any)
      .update({ status: "published", principal_signature: `Signed by ${profile.full_name}`, principal_signed_at: new Date().toISOString() })
      .eq("id", id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
