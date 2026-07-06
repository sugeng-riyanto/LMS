import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError
    const supabase = createAdminClient()
    const { data } = await (supabase.from("classes") as any).select("*").order("grade").order("class_name")
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError
    const body = await request.json()
    if (body.grade === undefined || !body.class_name) {
      return NextResponse.json({ error: "grade and class_name are required" }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from("classes") as any)
      .insert({ grade: body.grade, class_name: body.class_name })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
