import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, grade_assigned")
      .eq("id", user.id)
      .single() as { data: { role: string; grade_assigned: number | null } | null }

    const { id } = await params

    let query = (supabase.from("weekly_packages") as any).select("*").eq("id", id)

    if (profile?.role === "student") {
      query = query.eq("status", "published")
      if (profile.grade_assigned) query = query.eq("grade", profile.grade_assigned)
    }
    // Principals see only their level (JHS = grades 7-9, SHS = grades 10-12)
    if (profile?.role === "principal") {
      const { getPrincipalLevel } = await import("@/lib/supabase/require-role")
      const level = await getPrincipalLevel(supabase, user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Package not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const row = data as Record<string, unknown> | null

    if (profile?.role === "lab_assistant" && row) {
      const { lab_logistics, id, grade, week_number, topic, status } = row
      return NextResponse.json({ id, grade, week_number, topic, lab_logistics, status })
    }

    const normalized = row ? { ...row, title: row.topic ?? "", week: row.week_number } : row

    return NextResponse.json(normalized)
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
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    const allowedFields = [
      "topic",
      "syllabus_ref",
      "lesson_plan",
      "worksheet",
      "pre_class",
      "lab_logistics",
      "answer_keys",
      "wa_blast",
      "status",
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    updates.updated_at = new Date().toISOString()

    if (body.status === "approved") {
      updates.approved_at = new Date().toISOString()
      updates.approved_by = user.id
    }
    if (body.status === "published") {
      updates.published_at = new Date().toISOString()
    }

    const { data, error } = await (supabase.from("weekly_packages") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Package not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const row = data as Record<string, unknown> | null
    const normalized = row ? { ...row, title: row.topic ?? "", week: row.week_number } : row

    return NextResponse.json(normalized)
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
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const { id } = await params

    const { error } = await (supabase.from("weekly_packages") as any)
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Package deleted successfully" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
