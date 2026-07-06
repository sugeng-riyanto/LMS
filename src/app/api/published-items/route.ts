import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const subject = searchParams.get("subject")
    if (!grade) {
      return NextResponse.json({ error: "grade parameter is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let wsQuery = (supabase.from("shared_worksheets") as any)
      .select("id,title,grade,week_number,topic,pdf_url,published,created_at,score_category,subject")
      .eq("grade", parseInt(grade))
      .eq("published", true)
    if (subject) wsQuery = wsQuery.eq("subject", subject)

    let sylDocQuery = (supabase.from("syllabus_documents") as any)
      .select("id,grade,file_name,file_type,published,created_at,score_category")
      .eq("grade", parseInt(grade))
      .eq("published", true)

    let sylPlanQuery = (supabase.from("syllabus_planning") as any)
      .select("id,grade,week_number,topic,published,created_at,score_category,status,subject")
      .eq("grade", parseInt(grade))
      .eq("published", true)
    if (subject) sylPlanQuery = sylPlanQuery.eq("subject", subject)

    const [wsResult, sylDocResult, sylPlanResult] = await Promise.all([
      wsQuery.order("created_at", { ascending: false }),
      sylDocQuery.order("created_at", { ascending: false }),
      sylPlanQuery.order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      worksheets: wsResult.data ?? [],
      syllabi: sylDocResult.data ?? [],
      syllabus_plans: sylPlanResult.data ?? [],
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
