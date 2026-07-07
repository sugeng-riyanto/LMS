import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError

    const { data } = await (ADMIN().from("school_settings") as any).select("tpa_principal_weight, tpa_teacher_weight").eq("id", 1).single()
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
    let { principal, teacher } = body as { principal: number; teacher: number }
    if (principal == null || teacher == null) {
      return NextResponse.json({ error: "principal and teacher weights required" }, { status: 400 })
    }
    principal = Math.max(0, Math.min(100, principal))
    teacher = 100 - principal

    await (ADMIN().from("school_settings") as any)
      .upsert({ id: 1, tpa_principal_weight: principal, tpa_teacher_weight: teacher })

    return NextResponse.json({ principal, teacher })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
