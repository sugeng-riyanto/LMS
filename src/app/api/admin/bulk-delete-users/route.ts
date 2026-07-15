import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { supabase, user: admin, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const ids: string[] = body.user_ids || []
    if (ids.length === 0) return NextResponse.json({ error: "No user IDs provided" }, { status: 400 })

    // Don't allow deleting self
    const filtered = ids.filter((id: string) => id !== admin!.id)
    if (filtered.length === 0) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

    const adminClient = createAdminClient()
    let deleted = 0
    let errors = 0
    for (const userId of filtered) {
      try {
        // Delete auth user - this cascades to profile with ON DELETE CASCADE
        const { error } = await adminClient.auth.admin.deleteUser(userId)
        if (error) { errors++; continue }
        deleted++
      } catch { errors++ }
    }

    return NextResponse.json({ message: `Deleted ${deleted} of ${filtered.length} users${errors > 0 ? ` (${errors} errors)` : ""}` })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
