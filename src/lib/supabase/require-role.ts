import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "./server"

type Role = "super_admin" | "teacher" | "lab_assistant" | "student"

export async function requireRole(allowedRoles: Role[]) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: Role } | null }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { supabase, user, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, user, profile, error: null }
}
