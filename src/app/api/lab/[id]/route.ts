import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError

    const { id } = await params

    const { data, error } = await (supabase
      .from("lab_inventory") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return NextResponse.json({ error: "Item not found" }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "lab_assistant"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    const allowed = ["item_name", "category", "total_quantity", "available_quantity", "broken_quantity", "location", "notes"]
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("lab_inventory") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "lab_assistant"])
    if (authError) return authError

    const body = await request.json()

    if (!body.item_name) {
      return NextResponse.json({ error: "item_name is required" }, { status: 400 })
    }

    const { data, error } = await (supabase
      .from("lab_inventory") as any)
      .insert({
        item_name: body.item_name,
        category: body.category ?? null,
        total_quantity: body.total_quantity ?? 0,
        available_quantity: body.available_quantity ?? body.total_quantity ?? 0,
        broken_quantity: body.broken_quantity ?? 0,
        location: body.location ?? null,
        notes: body.notes ?? null,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { id } = await params

    const { error } = await (supabase.from("lab_inventory") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: "Inventory item deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
