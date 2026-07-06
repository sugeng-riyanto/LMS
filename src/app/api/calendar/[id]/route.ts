import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    // Verify ownership — super_admin can edit any, others only their own
    if (profile.role !== "super_admin") {
      const { data: evt } = await (supabase.from("academic_calendars") as any)
        .select("created_by").eq("id", id).single()
      if (!evt || evt.created_by !== user.id) {
        return NextResponse.json({ error: "You can only edit your own events" }, { status: 403 })
      }
    }

    const allowedFields = [
      "academic_year", "semester", "month", "week_number",
      "start_date", "end_date", "effective_days", "event_name",
      "event_type", "affected_grades", "is_holiday", "notes",
    ]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("academic_calendars") as any)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError

    const { id } = await params

    // Verify ownership
    if (profile.role !== "super_admin") {
      const { data: evt } = await (supabase.from("academic_calendars") as any)
        .select("created_by").eq("id", id).single()
      if (!evt || evt.created_by !== user.id) {
        return NextResponse.json({ error: "You can only delete your own events" }, { status: 403 })
      }
    }

    const { error } = await (supabase.from("academic_calendars") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ message: "Calendar event deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
