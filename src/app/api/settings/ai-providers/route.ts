import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    let query = (supabase.from("ai_providers") as any).select("*")
    if (profile.role !== "super_admin") {
      query = query.or(`owner_id.eq.${user.id},owner_id.is.null`)
    }
    const { data, error } = await query.order("priority")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const body = await request.json()
    const { provider_name, display_name, provider_type, api_key, base_url, default_model, available_models, is_active, priority, config } = body

    if (!provider_name || !display_name || !provider_type || !api_key || !default_model) {
      return NextResponse.json({ error: "provider_name, display_name, provider_type, api_key, and default_model are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("ai_providers") as any)
      .insert({
        provider_name,
        display_name,
        provider_type,
        api_key,
        base_url: base_url ?? null,
        default_model,
        available_models: available_models ?? [],
        is_active: is_active ?? true,
        priority: priority ?? 0,
        config: config ?? { temperature: 0.7, max_tokens: 4096 },
        created_by: user.id,
        owner_id: profile.role === "super_admin" ? null : user.id,
        test_status: "untested",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
