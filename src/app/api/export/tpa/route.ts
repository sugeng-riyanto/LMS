import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES, calculateTotal, getGradeLabel } from "@/tpa/rubric"
import * as XLSX from "xlsx"

const ADMIN = () => createAdminClient()

async function getSchoolInfo() {
  try {
    const { data } = await (ADMIN().from("school_settings") as any).select("*").eq("id", 1).single()
    return {
      name: data?.school_name ?? "Sekolah Harapan Bangsa",
      brand: data?.brand_name ?? "SHB Learning Hub",
      logoUrl: data?.logo_url ?? "",
    }
  } catch {
    return { name: "Sekolah Harapan Bangsa", brand: "SHB Learning Hub", logoUrl: "" }
  }
}

function svgBarChart(values: { label: string; value: number; max: number }[], width = 400, height = 200): string {
  const barW = Math.max(20, Math.floor(width / values.length) - 8)
  const bars = values.map((v, i) => {
    const barH = v.max > 0 ? (v.value / v.max) * (height - 30) : 0
    const x = i * (barW + 8) + 20
    const y = height - 10 - barH
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="#3b82f6" rx="3"/>
      <text x="${x + barW / 2}" y="${height - 2}" text-anchor="middle" font-size="8" fill="#666">${escapeHtml(v.label)}</text>
      <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#333">${(v.value / (v.max || 1) * 100).toFixed(0)}%</text>`
  }).join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${bars}</svg>`
}

function svgPieChart(values: { label: string; value: number; color: string }[], size = 200): string {
  const total = values.reduce((s, v) => s + v.value, 0) || 1
  let cumulative = 0
  const slices = values.map((v) => {
    const pct = v.value / total
    const startAngle = cumulative * 360
    const endAngle = (cumulative + pct) * 360
    cumulative += pct
    const r = size / 2 - 10; const cx = size / 2; const cy = size / 2 + 10
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180)
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180)
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180)
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180)
    const large = pct > 0.5 ? 1 : 0
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${v.color}" stroke="#fff" stroke-width="1"/>
      <text x="${cx + r * 0.6 * Math.cos(((startAngle + endAngle) / 2 * Math.PI) / 180)}" y="${cy + r * 0.6 * Math.sin(((startAngle + endAngle) / 2 * Math.PI) / 180)}" text-anchor="middle" font-size="8" fill="#fff">${(pct * 100).toFixed(0)}%</text>`
  }).join("")
  const legend = values.map((v, i) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin:0 8px 4px 0;font-size:10px"><span style="display:inline-block;width:10px;height:10px;background:${v.color};border-radius:2px"></span>${escapeHtml(v.label)}</span>`
  ).join("")
  return `<div style="text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 40}" viewBox="0 0 ${size} ${size + 40}">${slices}</svg><div style="margin-top:4px">${legend}</div></div>`
}

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "xlsx"
    const periodType = searchParams.get("period_type") || ""
    const teacherId = searchParams.get("teacher_id") || ""
    const school = await getSchoolInfo()

    let query = (ADMIN().from("teacher_performance_assessments") as any)
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
      wsSummary["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

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

    if (format === "pdf") {
      const html = generateTPAReportHTML(items, periodType, school)
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

function renderSig(sig: string | null): string {
  if (!sig) return "—"
  if (sig.startsWith("data:image")) {
    return `<img src="${sig}" style="max-width:120px;height:25px" />`
  }
  return escapeHtml(sig)
}

function generateTPAReportHTML(items: any[], periodType: string, school: { name: string; brand: string; logoUrl: string }): string {
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
      <td>${renderSig(item.principal_signature)}</td>
      <td>${renderSig(item.teacher_signature)}</td>
    </tr>`
  }

  // Status distribution chart
  const statusCount: Record<string, number> = {}
  for (const item of items) { statusCount[item.status] = (statusCount[item.status] || 0) + 1 }
  const statusChartData = Object.entries(statusCount).map(([k, v]) => ({
    label: k, value: v, max: Math.max(...Object.values(statusCount), 1),
  }))
  const statusChart = svgBarChart(statusChartData)

  // Combined score ranges pie
  const ranges = { "0-40%": 0, "40-60%": 0, "60-80%": 0, "80-100%": 0 }
  for (const item of items) {
    const s = item.combined_total ?? 0
    if (s < 40) ranges["0-40%"]++
    else if (s < 60) ranges["40-60%"]++
    else if (s < 80) ranges["60-80%"]++
    else ranges["80-100%"]++
  }
  const pieData = Object.entries(ranges).filter(([, v]) => v > 0).map(([k, v], i) => ({
    label: k, value: v, color: CHART_COLORS[i % CHART_COLORS.length],
  }))
  const scorePie = svgPieChart(pieData)

  const logoHtml = school.logoUrl ? `<img src="${escapeHtml(school.logoUrl)}" style="height:48px;margin-right:12px" />` : ""

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>TPA Report</title>
<style>
@page{size:A4;margin:15mm}
body{font-family:Inter,sans-serif;margin:0;padding:0;color:#1a1a2e;font-size:11px}
.header{display:flex;align-items:center;gap:12px;margin-bottom:16px}
h1{font-size:18px;margin:0}
.sub{font-size:11px;color:#666;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:9px}
th,td{border:1px solid #ddd;padding:4px 5px;text-align:left;vertical-align:middle}
th{background:#f5f5f5;font-weight:600}
.charts{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}
.chart-box{border:1px solid #e5e7eb;border-radius:6px;padding:12px;flex:1;min-width:240px}
.chart-box h3{font-size:12px;margin:0 0 6px}
.page-break{page-break-before:always}
@media print{body{font-size:9px}th{background:#eee!important;-webkit-print-color-adjust:exact}img{-webkit-print-color-adjust:exact}}
</style></head><body>
<div class="header">${logoHtml}<div><h1>${escapeHtml(school.name)}</h1><p style="margin:2px 0 0;font-size:13px;color:#555">Teacher Performance Assessment — ${escapeHtml(periodLabel)}</p></div></div>
<p class="sub">Generated on ${new Date().toLocaleDateString()} · ${items.length} assessment(s)</p>
<div class="charts">
<div class="chart-box"><h3>Status Distribution</h3>${statusChart}</div>
<div class="chart-box"><h3>Score Range Distribution</h3>${scorePie}</div>
</div>
<table><thead><tr>
<th>Teacher</th><th>G</th><th>Subject</th><th>Period</th><th>Status</th>
<th>Principal</th><th>Teacher</th><th>Combined</th><th>Grade</th><th>P.Sign</th><th>T.Sign</th>
</tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:16px;font-size:10px;color:#999">${escapeHtml(school.brand)} — TPA Report</p>
</body></html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
