import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const ROLES = ["super_admin", "teacher", "lab_assistant", "student", "principal"] as const

// Hardcoded defaults from proxy.ts (fallback)
const DEFAULT_PAGE_ROUTES: Record<string, string[]> = {
  "/grades": ["super_admin", "teacher"],
  "/generate": ["super_admin", "teacher"],
  "/grading": ["super_admin", "teacher"],
  "/profile": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/help": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/lesson-plan": ["super_admin", "teacher"],
  "/memory": ["super_admin", "teacher"],
  "/analytics": ["super_admin", "teacher", "principal"],
  "/journals": ["super_admin", "teacher"],
  "/settings": ["super_admin", "teacher", "principal"],
  "/lab": ["super_admin", "lab_assistant"],
  "/syllabus": ["super_admin", "teacher"],
  "/syllabus-manager": ["super_admin", "teacher"],
  "/worksheets": ["super_admin", "teacher"],
  "/calendar": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/my-week": ["student"],
  "/my-work": ["student"],
  "/my-progress": ["student"],
  "/my-journal": ["student"],
  "/pre-class": ["student"],
  "/principal": ["principal"],
  "/supervisions": ["super_admin", "principal", "teacher"],
  "/tpa": ["super_admin", "principal", "teacher"],
  "calendar:create": ["super_admin", "teacher", "lab_assistant", "principal"],
  "calendar:edit": ["super_admin"],
  "calendar:delete": ["super_admin"],
}

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const supabase = await createServerSupabaseClient()
    const { data: dbPerms } = await (supabase.from("role_permissions") as any)
      .select("route, role")
      .order("route")

    // Build DB entries map
    const dbEntries: Record<string, Set<string>> = {}
    for (const p of dbPerms ?? []) {
      if (!dbEntries[p.route]) dbEntries[p.route] = new Set()
      dbEntries[p.route].add(p.role)
    }

    // Convert to serializable form
    const dbRoutes: Record<string, string[]> = {}
    for (const [route, roles] of Object.entries(dbEntries)) {
      dbRoutes[route] = Array.from(roles).sort()
    }

    return NextResponse.json({ dbRoutes, defaults: DEFAULT_PAGE_ROUTES, roles: ROLES })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { route, roles } = body as { route: string; roles: string[] }

    if (!route || !Array.isArray(roles)) {
      return NextResponse.json({ error: "route and roles array required" }, { status: 400 })
    }

    // Delete all existing for this route (table may not exist)
    const { error: delErr } = await (supabase.from("role_permissions") as any).delete().eq("route", route)
    if (delErr && !delErr.message?.includes("does not exist")) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    // Insert new
    if (roles.length > 0) {
      const inserts = roles.map((r: string) => ({ route, role: r }))
      const { error: insertErr } = await (supabase.from("role_permissions") as any).insert(inserts)
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Updated" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
