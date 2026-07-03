import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const { submission_ids, action } = body // action: "publish" or "unpublish"

    if (!Array.isArray(submission_ids) || submission_ids.length === 0) {
      return NextResponse.json({ error: "submission_ids array is required" }, { status: 400 })
    }

    if (action === "publish") {
      const now = new Date().toISOString()
      const { data: graded, error: fetchError } = await (supabase.from("student_work") as any)
        .select("id, student_id, score, score_category, question_text, question_id, package_id")
        .in("id", submission_ids)
        .eq("status", "graded")

      if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

      // Validate all have score_category set
      const noCategory = (graded ?? []).filter((w: any) => !w.score_category)
      if (noCategory.length > 0) {
        return NextResponse.json({
          error: `${noCategory.length} submission(s) don't have a category. Set category (Classwork, Unit Test, etc.) before publishing.`
        }, { status: 400 })
      }

      const ids = (graded ?? []).map((w: any) => w.id)

      if (ids.length === 0) {
        return NextResponse.json({ error: "No graded submissions found to publish" }, { status: 400 })
      }

      const { error: updateError } = await (supabase.from("student_work") as any)
        .update({ status: "returned", published_at: now })
        .in("id", ids)

      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      // Create notifications for each student with score + category
      const admin = await createAdminClient()
      for (const w of graded ?? []) {
        await (admin.from("student_notifications") as any).insert({
          student_id: w.student_id,
          title: "Score Published",
          message: `"${w.question_text || w.question_id}" → ${w.score ?? "?"}/${w.max_score ?? 10} (${(w.score_category || "N/A").replace(/_/g, " ")})`,
          type: "grade_published",
          link_url: w.worksheet_id ? `/worksheet/public/${w.worksheet_id}` : w.syllabus_id ? `/syllabus/public/${w.syllabus_id}` : "/my-work",
        })
      }

      return NextResponse.json({ published: ids.length })
    }

    if (action === "unpublish") {
      const { error } = await (supabase.from("student_work") as any)
        .update({ status: "graded", published_at: null })
        .in("id", submission_ids)
        .eq("status", "returned")

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ unpublished: submission_ids.length })
    }

    return NextResponse.json({ error: "action must be 'publish' or 'unpublish'" }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
