import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Teachers can only update their own providers
    if (profile.role !== "super_admin") {
      const { data: existing } = await (supabase.from("ai_providers") as any)
        .select("owner_id")
        .eq("id", id)
        .single()
      if (!existing || (existing.owner_id && existing.owner_id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const allowedFields = [
      "provider_name", "display_name", "provider_type",
      "api_key", "base_url", "default_model", "available_models",
      "is_active", "priority", "config", "test_status",
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("ai_providers") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params

    // Teachers can only delete their own providers
    if (profile.role !== "super_admin") {
      const { data: existing } = await (supabase.from("ai_providers") as any)
        .select("owner_id")
        .eq("id", id)
        .single()
      if (!existing || (existing.owner_id && existing.owner_id !== user.id)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { error } = await (supabase.from("ai_providers") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "AI provider deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
