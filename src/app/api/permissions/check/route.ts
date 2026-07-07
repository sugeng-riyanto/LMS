import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const CRUD_PERMISSIONS: Record<string, string[]> = {
  "calendar:create": ["super_admin", "teacher", "lab_assistant", "principal"],
  "calendar:edit": ["super_admin"],
  "calendar:delete": ["super_admin"],
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const role = user.app_metadata?.role as string | undefined
    let userRole = role
    if (!userRole) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single() as any
      userRole = profile?.role
    }

    // Read DB overrides
    const { data: dbPerms } = await (supabase.from("role_permissions") as any)
      .select("route, role")
      .in("route", ["calendar:create", "calendar:edit", "calendar:delete"])

    const overrides: Record<string, Set<string>> = {}
    for (const p of dbPerms ?? []) {
      if (!overrides[p.route]) overrides[p.route] = new Set()
      overrides[p.route].add(p.role)
    }

    const result: Record<string, boolean> = {}
    for (const [perm, defaultRoles] of Object.entries(CRUD_PERMISSIONS)) {
      const allowed = overrides[perm] ? Array.from(overrides[perm]) : defaultRoles
      result[perm.replace("calendar:", "")] = allowed.includes(userRole ?? "")
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ create: true, edit: false, delete: false })
  }
}
