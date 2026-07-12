import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const { user_ids } = body
    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json({ error: "user_ids array is required" }, { status: 400 })
    }

    const admin = createAdminClient()
    const results: { id: string; email?: string; full_name?: string; temp_password: string; error?: string }[] = []

    for (const id of user_ids) {
      try {
        const tempPassword = "SHB-" + Math.random().toString(36).slice(2, 8)
        const { error: updateError } = await admin.auth.admin.updateUserById(id, { password: tempPassword })
        if (updateError) {
          results.push({ id, error: updateError.message, temp_password: "" })
        } else {
          // Also fetch profile info
          const { data } = await (admin.from("profiles") as any)
            .select("email, full_name")
            .eq("id", id)
            .single()
          results.push({ id, email: data?.email, full_name: data?.full_name, temp_password: tempPassword })
        }
      } catch (e: any) {
        results.push({ id, error: e.message, temp_password: "" })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}