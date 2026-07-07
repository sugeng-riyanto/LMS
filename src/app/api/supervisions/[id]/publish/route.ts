import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, profile, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const { id } = await params

    if (profile.role !== "super_admin") {
      const { data: s } = await (ADMIN().from("supervisions") as any).select("principal_id, status").eq("id", id).single()
      if (!s || s.principal_id !== user.id) return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const now = new Date()
    const day = String(now.getDate()).padStart(2, "0")
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const year = now.getFullYear()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    const seconds = String(now.getSeconds()).padStart(2, "0")
    const dateStr = `Day: ${day}-${month}-${year} Time: ${hours}--${minutes}--${seconds}`

    const sigValue = body.signature_data_url
      ? `${body.signature_data_url}`
      : `Signed by ${profile.full_name} — ${dateStr}`

    const { data, error } = await (ADMIN().from("supervisions") as any)
      .update({ status: "published", principal_signature: sigValue, principal_signed_at: new Date().toISOString() })
      .eq("id", id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
