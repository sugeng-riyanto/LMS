import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get("role")

    let query = supabase
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned, class_id, is_active, last_login_at, created_at")
      .order("full_name")

    if (roleFilter) query = query.eq("role", roleFilter)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
