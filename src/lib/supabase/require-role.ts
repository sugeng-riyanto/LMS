import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "./server"

type Role = "super_admin" | "teacher" | "lab_assistant" | "student"

export async function requireRole(allowedRoles: Role[]) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  // Fast path: role in JWT app_metadata — zero DB queries
  const jwtRole = user.app_metadata?.role as Role | undefined
  if (jwtRole && allowedRoles.includes(jwtRole)) {
    const fullName = (user.app_metadata?.full_name as string) || ""
    return {
      supabase,
      user,
      profile: { role: jwtRole, full_name: fullName } as { role: Role; full_name: string },
      error: null,
    }
  }

  // Fallback: query profiles table (existing users without JWT role)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single() as { data: { role: Role; full_name: string } | null }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { supabase, user, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, user, profile, error: null }
}

export async function getTeacherSubjects(supabase: any, userId: string): Promise<string[]> {
  const { data } = await (supabase
    .from("teacher_assignments") as any)
    .select("subject")
    .eq("teacher_id", userId)
  return [...new Set<string>((data ?? []).map((r: any) => r.subject))]
}
