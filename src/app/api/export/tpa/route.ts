import { NextRequest, NextResponse } from "next/server"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES, calculateTotal, getGradeLabel } from "@/tpa/rubric"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "xlsx" // xlsx or pdf
    const periodType = searchParams.get("period_type") || ""
    const teacherId = searchParams.get("teacher_id") || ""

    let query = (supabase.from("teacher_performance_assessments") as any)
      .select("*, teacher:teacher_id(id, full_name), principal:principal_id(id, full_name)")
      .order("created_at", { ascending: false })

    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      query = query.eq("principal_id", user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      query = query.eq("teacher_id", user.id)
    }
    if (periodType) query = query.eq("period_type", periodType)
    if (teacherId) query = query.eq("teacher_id", teacherId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = data ?? []

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new()

      // Summary sheet
      const summaryRows = [["Teacher", "Grade", "Subject", "Period", "Status", "Principal Score", "Teacher Score", "Combined Score", "Grade", "Principal Signed", "Teacher Signed"]]
      for (const item of items) {
        summaryRows.push([
          item.teacher?.full_name || "—",
          item.grade ? `G${item.grade}` : "—",
          item.subject || "—",
          item.period_label || `${item.period_type} ${item.semester}`,
          item.status,
          item.principal_total != null ? `${item.principal_total.toFixed(1)}%` : "—",
          item.teacher_total != null ? `${item.teacher_total.toFixed(1)}%` : "—",
          item.combined_total != null ? `${item.combined_total.toFixed(1)}%` : "—",
          item.combined_grade || "—",
          item.principal_signature ? "Yes" : "No",
          item.teacher_signature ? "Yes" : "No",
        ])
      }
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

      // Per-teacher detailed sheets (include rubric scores)
      for (const item of items) {
        const scores = item.principal_scores || item.teacher_scores || {}
        const rows: any[][] = [["Category", "Item", "Criterion", "Score (0-4)"]]
        for (const cat of TPA_CATEGORIES) {
          const catScores = scores[cat.key] || {}
          for (const criterion of cat.items) {
            const score = catScores[criterion.id] ?? "—"
            rows.push([cat.label, criterion.id, criterion.text, score])
          }
        }
        const wsDetail = XLSX.utils.aoa_to_sheet(rows)
        wsDetail["!cols"] = [{ wch: 30 }, { wch: 6 }, { wch: 60 }, { wch: 12 }]
        const sheetName = (item.teacher?.full_name || "Unknown").substring(0, 31)
        XLSX.utils.book_append_sheet(wb, wsDetail, sheetName)
      }

      const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
      const prefix = periodType ? `${periodType}-` : "all-"
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="tpa-${prefix}report.xlsx"`,
        },
      })
    }

    // PDF — return HTML that can be printed
    if (format === "pdf") {
      const html = generateTPAReportHTML(items, periodType)
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="tpa-${periodType || 'all'}-report.html"`,
        },
      })
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function generateTPAReportHTML(items: any[], periodType: string): string {
  const periodLabel = periodType ? `${periodType.charAt(0).toUpperCase() + periodType.slice(1)} Report` : "Full Report"
  let rows = ""
  for (const item of items) {
    rows += `<tr>
      <td>${escapeHtml(item.teacher?.full_name || "—")}</td>
      <td>${item.grade ? `G${item.grade}` : "—"}</td>
      <td>${escapeHtml(item.subject || "—")}</td>
      <td>${escapeHtml(item.period_label || `${item.period_type} ${item.semester}`)}</td>
      <td>${item.status}</td>
      <td>${item.principal_total != null ? item.principal_total.toFixed(1) + "%" : "—"}</td>
      <td>${item.teacher_total != null ? item.teacher_total.toFixed(1) + "%" : "—"}</td>
      <td>${item.combined_total != null ? item.combined_total.toFixed(1) + "%" : "—"}</td>
      <td>${item.combined_grade || "—"}</td>
      <td>${item.principal_signature ? "✓" : "—"}</td>
      <td>${item.teacher_signature ? "✓" : "—"}</td>
    </tr>`
  }

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>TPA Report</title>
<style>
body{font-family:Inter,sans-serif;margin:20px;color:#1a1a2e}
h1{font-size:18px;margin-bottom:4px}
.sub{font-size:12px;color:#666;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:11px}
th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
th{background:#f5f5f5;font-weight:600}
tr:nth-child(even){background:#fafafa}
@media print{body{margin:10mm}th{background:#eee}}
</style></head><body>
<h1>Teacher Performance Assessment — ${escapeHtml(periodLabel)}</h1>
<p class="sub">Generated on ${new Date().toLocaleDateString()} · ${items.length} assessment(s)</p>
<table><thead><tr>
<th>Teacher</th><th>Grade</th><th>Subject</th><th>Period</th><th>Status</th>
<th>Principal</th><th>Teacher</th><th>Combined</th><th>Grade</th><th>P.Sign</th><th>T.Sign</th>
</tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:16px;font-size:10px;color:#999">SHB Learning Hub — TPA Report</p>
</body></html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
