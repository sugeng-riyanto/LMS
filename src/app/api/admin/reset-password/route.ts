import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { user_id } = await request.json()
    if (!user_id) return NextResponse.json({ error: "user_id is required" }, { status: 400 })

    const tempPassword = "SHB-" + Math.random().toString(36).slice(2, 8)

    const admin = createAdminClient()
    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
      password: tempPassword,
    })

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ temp_password: tempPassword })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
