import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get student's profile
    const { data: profile } = await (supabase.from("profiles") as any)
      .select("*")
      .eq("id", user.id)
      .single()

    // Show scores only when teacher has published (status = 'returned')
    const { data: work } = await (supabase.from("student_work") as any)
      .select("*")
      .eq("student_id", user.id)
      .eq("status", "returned")
      .order("submitted_at", { ascending: false })

    const items = (work ?? []) as Array<Record<string, unknown>>

    // Calculate per-category averages
    const categories = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"] as const
    const weights: Record<string, number> = { classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1 }
    const labels: Record<string, string> = { classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester" }

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
