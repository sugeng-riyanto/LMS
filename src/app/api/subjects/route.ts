import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from("subjects") as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
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
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "code and name are required" }, { status: 400 })
    }
    const supabase = createAdminClient()
    const { data, error } = await (supabase.from("subjects") as any)
      .insert({ code: body.code, name: body.name, icon: body.icon ?? "📚", sort_order: body.sort_order ?? 0 })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
