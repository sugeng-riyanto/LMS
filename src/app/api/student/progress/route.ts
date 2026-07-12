import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { getAssessmentWeights, CATEGORIES, CATEGORY_LABELS } from "@/lib/syllabus/assessment-weights"

export async function GET(request: Request) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["student", "principal"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")

    // Get student's grade
    const { data: stuProfile } = await (supabase.from("profiles") as any)
      .select("grade_assigned").eq("id", user.id).maybeSingle()
    const grade = stuProfile?.grade_assigned || 10
    const weights = await getAssessmentWeights(supabase, grade)
    const categories = CATEGORIES
    const labels = CATEGORY_LABELS

    // Show scores only when teacher has published (status = 'returned')
    let workQuery = (supabase.from("student_work") as any)
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "returned")
    if (subject) workQuery = workQuery.eq("subject", subject)
    const { data: work } = await workQuery.order("submitted_at", { ascending: false })

    const items = (work ?? []) as Array<Record<string, unknown>>

    const breakdown = categories.map((cat) => {
      const catItems = items.filter((i) => i.score_category === cat)
      const totalScore = catItems.reduce((s, i) => s + ((i.score as number) || 0), 0)
      const totalMax = catItems.reduce((s, i) => s + ((i.max_score as number) || 10), 0)
      const pct = totalMax > 0 ? (totalScore / totalMax) * 100 : 0
      return {
        category: cat,
        label: labels[cat],
        count: catItems.length,
        average: Math.round(pct * 10) / 10,
        weighted: Math.round(pct * weights[cat] * 10) / 10,
        weight: weights[cat],
        items: catItems.map((i) => ({
          id: i.id,
          question_text: i.question_text,
          score: i.score,
          max_score: i.max_score,
          subject: i.subject,
          submitted_at: i.submitted_at,
        })),
      }
    })

    const weightedTotal = breakdown.reduce((s, b) => s + b.weighted, 0)

    return NextResponse.json({
      student: profile,
      total_work: items.length,
      weighted_total: Math.round(weightedTotal * 10) / 10,
      breakdown,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
