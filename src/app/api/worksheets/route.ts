import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const ids = searchParams.get("ids")
    const subject = searchParams.get("subject")

    let query = (supabase.from("shared_worksheets") as any).select("id,title,grade,week_number,topic,pdf_url,pdf_pages,media_links,objectives,reference_pdf_url,theory_video_url,theory_video_title,page_images,published,score_category,max_score,subject,created_at").order("created_at", { ascending: false })
    if (grade) query = query.eq("grade", Number(grade))
    if (subject) query = query.eq("subject", subject)
    if (grade) query = query.eq("grade", Number(grade))
    if (ids) {
      const idArr = ids.split(",").filter(Boolean)
      if (idArr.length > 0) query = query.in("id", idArr)
    }
    // Teachers can only see their own subject's worksheets
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (subjects.length > 0) query = query.in("subject", subjects)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    if (!body.title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    if (!body.pdf_url && (!body.page_images || body.page_images.length === 0)) {
      return NextResponse.json({ error: "pdf_url or page_images is required" }, { status: 400 })
    }

    // Teachers can only create worksheets for their own subjects
    if (profile?.role === "teacher" && body.subject) {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (!subjects.includes(body.subject)) {
        return NextResponse.json({ error: "You can only create worksheets for your assigned subjects" }, { status: 403 })
      }
    }

    const validCats = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
    if (body.score_category && !validCats.includes(body.score_category)) {
      return NextResponse.json({ error: "Invalid score_category" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("shared_worksheets") as any)
      .insert({ ...body, created_by: user.id })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
