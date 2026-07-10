import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { clearCredentialsCache } from "@/lib/supabase/supabase-config"
import { getFallbackCredentials } from "@/lib/supabase/supabase-config"
import { loadServerCredentials } from "@/lib/supabase/supabase-config"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student", "principal"])
    if (authError) return authError

    await loadServerCredentials()
    const fallback = getFallbackCredentials()

    const { data } = await (supabase.from("school_settings") as any)
      .select("supabase_url, supabase_anon_key, supabase_service_role_key, supabase_db_connection")
      .eq("id", 1)
      .single()

    return NextResponse.json({
      supabase_url: data?.supabase_url ?? fallback.url,
      supabase_anon_key: data?.supabase_anon_key ?? fallback.anonKey,
      supabase_service_role_key: data?.supabase_service_role_key ?? fallback.serviceKey,
      supabase_db_connection: data?.supabase_db_connection ?? "",
      is_configured: !!(data?.supabase_url && data?.supabase_anon_key),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const allowed = ["supabase_url", "supabase_anon_key", "supabase_service_role_key", "supabase_db_connection"]
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id }
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { error } = await (supabase.from("school_settings") as any)
      .upsert({ id: 1, ...updates })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await clearCredentialsCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
