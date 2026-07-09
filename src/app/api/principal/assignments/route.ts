import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    let query = (supabase.from("principal_assignments") as any)
      .select("*, principal:principal_id(id, email, full_name)")
      .order("created_at")

    if (user.role === "principal") {
      query = query.eq("principal_id", user.id)
    }

    const { data } = await query

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
    if (!body.principal_id || !body.level) {
      return NextResponse.json({ error: "principal_id and level are required" }, { status: 400 })
    }
    if (!["JHS", "SHS"].includes(body.level)) {
      return NextResponse.json({ error: "level must be JHS or SHS" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("principal_assignments") as any)
      .upsert({ principal_id: body.principal_id, level: body.level }, { onConflict: "principal_id" })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
