import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const packageId = searchParams.get("packageId")

    if (!packageId) {
      return NextResponse.json({ error: "packageId query parameter is required" }, { status: 400 })
    }

    const { data: pkg, error } = await supabase
      .from("weekly_packages")
      .select("*")
      .eq("id", packageId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Package not found" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const pkgData = pkg as any

    return NextResponse.json({
      message: "PDF export placeholder",
      package: {
        id: pkgData.id,
        grade: pkgData.grade,
        week_number: pkgData.week_number,
        topic: pkgData.topic,
        status: pkgData.status,
      },
      export_format: "pdf",
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
