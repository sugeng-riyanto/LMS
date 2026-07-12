import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import { getAssessmentWeights, CATEGORIES, CATEGORY_LABELS } from "@/lib/syllabus/assessment-weights"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const { searchParams } = new URL(request.url)
    const grade = parseInt(searchParams.get("grade") || "0")

    const WEIGHTS = await getAssessmentWeights(supabase, grade)
    const LABELS = CATEGORY_LABELS
    const geo = request.headers.get("x-vercel-ip-city") || ""

    const subject = searchParams.get("subject")

    const admin = createAdminClient()
    let studentsQuery = (admin.from("profiles") as any)
      .select("id, full_name, grade_assigned")
      .eq("role", "student")
      .order("full_name")

    // Principals see only their level (JHS = grades 7-9, SHS = grades 10-12)
    if (profile?.role === "principal") {
      const { getPrincipalLevel } = await import("@/lib/supabase/require-role")
      const level = await getPrincipalLevel(supabase, user.id)
      if (level === "JHS") studentsQuery = studentsQuery.in("grade_assigned", [7, 8, 9])
      else if (level === "SHS") studentsQuery = studentsQuery.in("grade_assigned", [10, 11, 12])
    }

    if (grade > 0) {
      studentsQuery = studentsQuery.eq("grade_assigned", grade)
    }

    const { data: students } = await studentsQuery
    if (!students || students.length === 0) {
      return NextResponse.json({ error: "No students found" }, { status: 404 })
    }

    const studentIds = students.map((s: any) => s.id)
    let workQuery = (admin.from("student_work") as any)
      .select("*")
      .in("student_id", studentIds)
      .not("score", "is", null)
    if (subject) workQuery = workQuery.eq("subject", subject)
    const { data: work } = await workQuery.order("submitted_at", { ascending: false })
    const allWork = (work ?? []) as any[]

    const rows: any[] = []
    const headers = ["No", "Student Name", "Grade"]
    CATEGORIES.forEach((cat) => {
      headers.push(`${LABELS[cat]} (%)`)
      headers.push(`${LABELS[cat]} (Weighted)`)
    })
    headers.push("Weighted Total (%)")

    students.forEach((student: any, idx: number) => {
      const sWork = allWork.filter((w: any) => w.student_id === student.id)

      const catScores: Record<string, { total: number; max: number }> = {}
      CATEGORIES.forEach((cat) => { catScores[cat] = { total: 0, max: 0 } })

      sWork.forEach((w: any) => {
        const cat = w.score_category || "uncategorized"
        if (!catScores[cat]) catScores[cat] = { total: 0, max: 0 }
        catScores[cat].total += parseFloat(w.score) || 0
        catScores[cat].max += parseFloat(w.max_score) || 10
      })

      const row: any[] = [idx + 1, student.full_name, `Grade ${student.grade_assigned}`]
      let weightedTotal = 0

      CATEGORIES.forEach((cat) => {
        const c = catScores[cat]
        const pct = c.max > 0 ? (c.total / c.max) * 100 : 0
        row.push(Math.round(pct * 10) / 10)
        const w = Math.round(pct * WEIGHTS[cat] * 10) / 10
        row.push(w)
        weightedTotal += w
      })

      row.push(Math.round(weightedTotal * 10) / 10)
      rows.push(row)
    })

    // Summary row
    const summaryRow: any[] = ["", "Grade Average", ""]
    CATEGORIES.forEach((cat) => {
      const catItems = allWork.filter((w: any) => w.score_category === cat)
      const total = catItems.reduce((s: number, w: any) => s + (parseFloat(w.score) || 0), 0)
      const max = catItems.reduce((s: number, w: any) => s + (parseFloat(w.max_score) || 10), 0)
      const pct = max > 0 ? (total / max) * 100 : 0
      summaryRow.push(Math.round(pct * 10) / 10)
      summaryRow.push(Math.round(pct * WEIGHTS[cat] * 10) / 10)
    })
    const grandTotal = CATEGORIES.reduce((sum, cat) => {
      const catItems = allWork.filter((w: any) => w.score_category === cat)
      const total = catItems.reduce((s: number, w: any) => s + (parseFloat(w.score) || 0), 0)
      const max = catItems.reduce((s: number, w: any) => s + (parseFloat(w.max_score) || 10), 0)
      const pct = max > 0 ? (total / max) * 100 : 0
      return sum + Math.round(pct * WEIGHTS[cat] * 10) / 10
    }, 0)
    summaryRow.push(Math.round(grandTotal * 10) / 10)
    rows.push(summaryRow)

    // Notes
    rows.push([])
    rows.push(["Weighting Rules:"])
    CATEGORIES.forEach((cat) => {
      rows.push([`${LABELS[cat]}: ${Math.round(WEIGHTS[cat] * 100)}%`])
    })
    rows.push([])
    rows.push([`Generated: ${new Date().toISOString()}`])
    rows.push([`Downloaded by: ${profile?.full_name ?? user.email} (${profile?.role ?? "unknown"})`])
    rows.push([`IP: ${ip}`])
    if (geo) rows.push([`Location: ${geo}`])

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    ws["!cols"] = headers.map((_: string, i: number) => ({ wch: i === 0 ? 5 : i === 1 ? 25 : i === 2 ? 10 : 18 }))
    XLSX.utils.book_append_sheet(wb, ws, "Weighted Scores")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    // Log the download
    try {
      await (supabase.from("download_logs") as any).insert({
        user_id: user.id,
        user_role: profile?.role ?? "unknown",
        full_name: profile?.full_name ?? user.email ?? "unknown",
        download_type: "scores_xlsx",
        ip_address: ip,
        geolocation: geo || null,
        metadata: { grade, subject, student_count: students.length },
      })
    } catch { /* non-blocking */ }

    const gradeLabel = grade > 0 ? `grade-${grade}` : "all-grades"
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="weighted-scores-${gradeLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
