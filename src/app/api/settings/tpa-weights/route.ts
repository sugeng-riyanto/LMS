import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const supabase = createAdminClient()
    const { data } = await (supabase.from("school_settings") as any)
      .select("tpa_principal_weight, tpa_teacher_weight")
      .eq("id", 1)
      .maybeSingle()

    return NextResponse.json({
      principal: data?.tpa_principal_weight ?? 70,
      teacher: data?.tpa_teacher_weight ?? 30,
    })
  } catch {
    return NextResponse.json({ principal: 70, teacher: 30 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const body = await request.json()
    let { principal } = body as { principal: number }
    if (principal == null) return NextResponse.json({ error: "principal weight required" }, { status: 400 })
    principal = Math.max(0, Math.min(100, principal))
    const teacher = 100 - principal

    const supabase = createAdminClient()
    const { error } = await (supabase.from("school_settings") as any)
      .upsert({ id: 1, school_name: "SHB", tpa_principal_weight: principal, tpa_teacher_weight: teacher })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ principal, teacher })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 })
  }
}
