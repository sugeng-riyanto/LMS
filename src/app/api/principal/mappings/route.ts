import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const { data } = await (supabase.from("principal_teacher_mappings") as any)
      .select("*, principal:principal_id(id, full_name), teacher:teacher_id(id, full_name)")
      .order("created_at")

    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    if (!body.principal_id || !body.teacher_id) {
      return NextResponse.json({ error: "principal_id and teacher_id are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("principal_teacher_mappings") as any)
      .insert({ principal_id: body.principal_id, teacher_id: body.teacher_id })
      .select("*, principal:principal_id(id, full_name), teacher:teacher_id(id, full_name)")
      .single()

    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "Mapping already exists" }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
