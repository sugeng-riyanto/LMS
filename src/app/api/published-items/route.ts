import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    if (!grade) {
      return NextResponse.json({ error: "grade parameter is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const [wsResult, sylResult] = await Promise.all([
      (supabase.from("shared_worksheets") as any)
        .select("id,title,grade,week_number,topic,pdf_url,published,created_at,score_category")
        .eq("grade", parseInt(grade))
        .eq("published", true)
        .order("created_at", { ascending: false }),
      (supabase.from("syllabus_documents") as any)
        .select("id,grade,file_name,file_type,published,created_at,score_category")
        .eq("grade", parseInt(grade))
        .eq("published", true)
        .order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      worksheets: wsResult.data ?? [],
      syllabi: sylResult.data ?? [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
