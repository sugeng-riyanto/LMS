import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    let query = (supabase.from("lab_inventory") as any).select("*")

    if (category) {
      query = query.eq("category", category)
    }

    query = query.order("item_name")

    const { data, error } = await query

    if (error) {
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

export async function PUT(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "lab_assistant"])
    if (authError) return authError

    const body = await request.json()
    const { id, available_quantity, broken_quantity, total_quantity, notes } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (available_quantity !== undefined) updates.available_quantity = available_quantity
    if (broken_quantity !== undefined) updates.broken_quantity = broken_quantity
    if (total_quantity !== undefined) updates.total_quantity = total_quantity
    if (notes !== undefined) updates.notes = notes

    const { data, error } = await (supabase.from("lab_inventory") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
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
