import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const CATEGORIES = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]
const WEIGHTS: Record<string, number> = { classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1 }
const LABELS: Record<string, string> = { classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester" }

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const subject = searchParams.get("subject")

    const admin = createAdminClient()
    let query = (admin.from("profiles") as any)
      .select("id, full_name, grade_assigned")
      .eq("role", "student")
      .order("full_name")

    // Principals see only their level (JHS = grades 7-9, SHS = grades 10-12)
    if (profile?.role === "principal") {
      const { getPrincipalLevel } = await import("@/lib/supabase/require-role")
      const level = await getPrincipalLevel(supabase, user.id)
      if (level === "JHS") query = query.in("grade_assigned", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade_assigned", [10, 11, 12])
    }

    if (grade && grade !== "all") {
      query = query.eq("grade_assigned", parseInt(grade))
    }

    const { data: students } = await query

    if (!students || students.length === 0) {
      return NextResponse.json({ students: [], summary: [], total_submissions: 0, grand_weighted_total: 0 })
    }

    const studentIds = students.map((s: any) => s.id)

    // Get all work for these students (only returned/graded with scores)
    let workQuery = (admin.from("student_work") as any)
      .select("*")
      .in("student_id", studentIds)
      .not("score", "is", null)
    if (subject) workQuery = workQuery.eq("subject", subject)
    const { data: work } = await workQuery.order("submitted_at", { ascending: false })

    const allWork = (work ?? []) as any[]

    // Per-student breakdown
    const studentScores = students.map((student: any) => {
      const sWork = allWork.filter((w: any) => w.student_id === student.id)

      const categoryScores: Record<string, { total: number; count: number; max: number }> = {}
      CATEGORIES.forEach((cat) => { categoryScores[cat] = { total: 0, count: 0, max: 0 } })

      sWork.forEach((w: any) => {
        const cat = w.score_category || "uncategorized"
        if (!categoryScores[cat]) categoryScores[cat] = { total: 0, count: 0, max: 0 }
        categoryScores[cat].total += parseFloat(w.score) || 0
        categoryScores[cat].count += 1
        categoryScores[cat].max += parseFloat(w.max_score) || 10
      })

      const breakdown = CATEGORIES.map((cat) => {
        const c = categoryScores[cat]
        const pct = c.max > 0 ? c.total / c.max : 0
        return {
          category: cat,
          label: LABELS[cat],
          count: c.count,
          average: Math.round(pct * 1000) / 10,
          total: Math.round(c.total * 10) / 10,
          max: c.max,
          pct: Math.round(pct * 1000) / 10,
          weighted: Math.round(pct * WEIGHTS[cat] * 1000) / 10,
          weight: WEIGHTS[cat],
        }
      })

      const weightedTotal = breakdown.reduce((s, b) => s + b.weighted, 0)

      return {
        student_id: student.id,
        full_name: student.full_name,
        grade_assigned: student.grade_assigned,
        total_work: sWork.length,
        graded_count: sWork.filter((w: any) => w.status === "graded" || w.status === "returned").length,
        returned_count: sWork.filter((w: any) => w.status === "returned").length,
        weighted_total: Math.round(weightedTotal * 10) / 10,
        breakdown,
      }
    })

    // Grade-level summary
    const gradeSummary: Record<string, { total: number; count: number; max: number; weight: number }> = {}
    CATEGORIES.forEach((cat) => { gradeSummary[cat] = { total: 0, count: 0, max: 0, weight: WEIGHTS[cat] } })

    allWork.forEach((w: any) => {
      const cat = w.score_category || "uncategorized"
      if (!gradeSummary[cat]) gradeSummary[cat] = { total: 0, count: 0, max: 0, weight: 0 }
      gradeSummary[cat].total += parseFloat(w.score) || 0
      gradeSummary[cat].count += 1
      gradeSummary[cat].max += parseFloat(w.max_score) || 10
    })

    const summary = CATEGORIES.map((cat) => {
      const c = gradeSummary[cat]
      const pct = c.max > 0 ? c.total / c.max : 0
      return {
        category: cat,
        label: LABELS[cat],
        count: c.count || 0,
        average: Math.round(pct * 1000) / 10,
        total: Math.round(c.total * 10) / 10,
        max: c.max,
        pct: Math.round(pct * 1000) / 10,
        weighted: Math.round(pct * WEIGHTS[cat] * 1000) / 10,
        weight: WEIGHTS[cat],
      }
    })

    const grandWeightedTotal = summary.reduce((s, b) => s + b.weighted, 0)

    return NextResponse.json({
      students: studentScores,
      summary,
      grand_weighted_total: Math.round(grandWeightedTotal * 10) / 10,
      total_submissions: allWork.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
