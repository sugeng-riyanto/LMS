import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { data, error } = await (supabase.from("saved_lesson_plans") as any)
      .select("*")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })

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
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    if (!body.name || !body.form_data) {
      return NextResponse.json({ error: "name and form_data are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("saved_lesson_plans") as any)
      .insert({
        name: body.name,
        grade: body.grade ?? 10,
        week: body.week ?? 1,
        form_data: body.form_data,
        created_by: user.id,
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
