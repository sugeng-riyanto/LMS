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
    const curriculum = searchParams.get("curriculum")

    let query = (supabase.from("syllabus_topics") as any).select("*").order("unit_id")

    if (grade) query = query.eq("grade", parseInt(grade))
    if (curriculum) query = query.eq("curriculum", curriculum)

    const { data, error } = await query
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
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const body = await request.json()
    if (!body.grade || !body.unit_id || !body.topic) {
      return NextResponse.json({ error: "grade, unit_id, and topic are required" }, { status: 400 })
    }
    const { data, error } = await (supabase.from("syllabus_topics") as any)
      .insert({ grade: parseInt(body.grade), unit_id: body.unit_id, topic: body.topic, subtopics: body.subtopics ?? [], syllabus_ref: body.syllabus_ref ?? null, curriculum: body.curriculum ?? "cambridge", suggested_weeks: body.suggested_weeks ?? [] })
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
    const allowed = ["grade", "unit_id", "topic", "subtopics", "syllabus_ref", "curriculum", "suggested_weeks"]
    const updates: Record<string, unknown> = {}
    for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]
    const { data, error } = await (supabase.from("syllabus_topics") as any)
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
    const ids = searchParams.get("ids")

    if (ids) {
      const idArr = ids.split(",").filter(Boolean)
      if (idArr.length === 0) return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
      const { error } = await (supabase.from("syllabus_topics") as any).delete().in("id", idArr)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ message: `Deleted ${idArr.length} topics` })
    }

    if (!id) return NextResponse.json({ error: "id or ids query parameter required" }, { status: 400 })
    const { error } = await (supabase.from("syllabus_topics") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}