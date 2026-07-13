import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "principal", "student", "lab_assistant"])
    if (authError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { data, error } = await (supabase.from("subjects") as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    if (!body.code || !body.name) {
      return NextResponse.json({ error: "code and name are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("subjects") as any)
      .insert({ code: body.code.toUpperCase(), name: body.name, icon: body.icon || "📘", sort_order: body.sort_order ?? 999 })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
