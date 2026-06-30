import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned, is_active, last_login_at, created_at")
      .order("full_name")

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
    const { id, email, full_name, role, grade_assigned } = body

    if (!id || !email || !full_name) {
      return NextResponse.json({ error: "id, email, and full_name are required" }, { status: 400 })
    }

    const { data, error } = await (supabase
      .from("profiles") as any)
      .insert({
        id,
        email,
        full_name,
        role: role ?? "student",
        grade_assigned: grade_assigned ?? null,
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
