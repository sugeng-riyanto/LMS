import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "tpa" // tpa or supervision
    const period = searchParams.get("period") || "all"
    const gradeFilter = searchParams.get("grade")
    const teacherFilter = searchParams.get("teacher_id")
    const month = searchParams.get("month")
    const year = searchParams.get("year") || "2026"

    let table = type === "tpa" ? "teacher_performance_assessments" : "supervisions"
    let scoreField = type === "tpa" ? "combined_total" : null

    let query = (ADMIN().from(table) as any).select("*")

    // Role-based filtering
    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      query = query.eq("principal_id", user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      query = query.eq("teacher_id", user.id)
    }

    // Filters
    if (gradeFilter) query = query.eq("grade", parseInt(gradeFilter))
    if (teacherFilter) query = query.eq("teacher_id", teacherFilter)

    if (period === "monthly" && month) {
      const start = `${year}-${String(parseInt(month)).padStart(2, "0")}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      const end = `${year}-${String(parseInt(month)).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
      query = query.gte("created_at", start).lte("created_at", end)
    } else if (period === "quarterly") {
      const q = parseInt(month || "1")
      const qStart = (q - 1) * 3 + 1
      const qEnd = q * 3
      query = query.gte("created_at", `${year}-${String(qStart).padStart(2, "0")}-01`)
        .lte("created_at", `${year}-${String(qEnd).padStart(2, "0")}-31`)
    } else if (period === "semester") {
      const sem = parseInt(month || "1")
      if (sem === 1) query = query.gte("created_at", `${year}-01-01`).lte("created_at", `${year}-06-30`)
      else query = query.gte("created_at", `${year}-07-01`).lte("created_at", `${year}-12-31`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const items = data ?? []

    // Aggregate for charts
    const scoreRanges = { "0-40": 0, "40-60": 0, "60-80": 0, "80-100": 0 }
    const gradeCount: Record<string, number> = {}
    const monthlyCount: Record<string, number> = {}
    const statusCount: Record<string, number> = {}
    const teacherScores: Record<string, { total: number; count: number }> = {}

    for (const item of items) {
      const score = type === "tpa" ? (item.combined_total ?? 0) : 0
      if (score < 40) scoreRanges["0-40"]++
      else if (score < 60) scoreRanges["40-60"]++
      else if (score < 80) scoreRanges["60-80"]++
      else scoreRanges["80-100"]++

      const g = `G${item.grade}`
      gradeCount[g] = (gradeCount[g] || 0) + 1

      const d = new Date(item.created_at)
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      monthlyCount[m] = (monthlyCount[m] || 0) + 1

      statusCount[item.status] = (statusCount[item.status] || 0) + 1

      if (item.teacher_id) {
        if (!teacherScores[item.teacher_id]) teacherScores[item.teacher_id] = { total: 0, count: 0 }
        teacherScores[item.teacher_id].total += score
        teacherScores[item.teacher_id].count++
      }
    }

    // Get teacher names
    const teacherIds = Object.keys(teacherScores)
    let teacherNames: Record<string, string> = {}
    if (teacherIds.length > 0) {
      const { data: teachers } = await (ADMIN().from("profiles") as any)
        .select("id, full_name")
        .in("id", teacherIds)
      for (const t of teachers ?? []) teacherNames[t.id] = t.full_name
    }

    const avgTeacherScores = Object.entries(teacherScores).map(([id, s]) => ({
      teacher_id: id,
      teacher_name: teacherNames[id] || "Unknown",
      avg_score: s.count > 0 ? Math.round((s.total / s.count) * 10) / 10 : 0,
      count: s.count,
    }))

    return NextResponse.json({
      total: items.length,
      scoreRanges,
      gradeDistribution: Object.entries(gradeCount).map(([k, v]) => ({ label: k, value: v })),
      monthlyTrend: Object.entries(monthlyCount).sort().map(([k, v]) => ({ label: k, value: v })),
      statusDistribution: Object.entries(statusCount).map(([k, v]) => ({ label: k, value: v })),
      teacherAverages: avgTeacherScores.sort((a, b) => b.avg_score - a.avg_score),
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
