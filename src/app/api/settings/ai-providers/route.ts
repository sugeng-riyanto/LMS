import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { data, error } = await (supabase.from("ai_providers") as any)
      .select("*")
      .order("priority")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const { provider_name, display_name, provider_type, api_key, base_url, default_model, available_models, is_active, priority, config } = body

    if (!provider_name || !display_name || !provider_type || !api_key || !default_model) {
      return NextResponse.json(
        { error: "provider_name, display_name, provider_type, api_key, and default_model are required" },
        { status: 400 }
      )
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
        test_status: "untested",
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
