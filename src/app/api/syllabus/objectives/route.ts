import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")

    let query = (supabase.from("syllabus_objectives") as any)
      .select("*")
      .order("sort_order")

    if (grade) query = query.eq("grade", parseInt(grade))

    const { data, error } = await query
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
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const body = await request.json()
    if (!body.grade || !body.unit_id || !body.topic) {
      return NextResponse.json({ error: "grade, unit_id, and topic are required" }, { status: 400 })
    }
    const { data, error } = await (supabase.from("syllabus_objectives") as any)
      .insert({ grade: parseInt(body.grade), unit_id: body.unit_id, topic: body.topic, objectives: body.objectives ?? [], syllabus_ref: body.syllabus_ref ?? "", curriculum: body.curriculum ?? "cambridge", sort_order: body.sort_order ?? 0 })
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

export async function PUT(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    const allowed = ["grade", "unit_id", "topic", "objectives", "syllabus_ref", "curriculum", "sort_order"]
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]
    const { data, error } = await (supabase.from("syllabus_objectives") as any)
      .update(updates).eq("id", body.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id query parameter is required" }, { status: 400 })
    const { error } = await (supabase.from("syllabus_objectives") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}