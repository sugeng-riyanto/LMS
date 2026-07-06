import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "lab_assistant", "student"])
    if (authError) return authError

    const { data, error } = await (supabase.from("school_settings") as any)
      .select("*")
      .eq("id", 1)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data ?? {
      school_name: "Sekolah Harapan Bangsa - Modernhill",
      vp_name: "Christina Sri Waryanti, S.Pd.",
      principal_name: "Sisilia Juni Arianti, S.Pd., M.Pd.",
      shs_vp_name: "Aji Wahyu Budiyanto, M.Si",
      shs_principal_name: "Dr Agustinus Joko Purwanto, S.Pd., M.M.",
      unit: "Academic",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const allowed = [
      "school_name", "brand_name", "vp_name", "principal_name",
      "shs_vp_name", "shs_principal_name",
      "unit", "address", "phone", "email", "logo_url",
    ]
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: user.id }
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("school_settings") as any)
      .upsert({ id: 1, ...updates })
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
