import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES } from "@/tpa/rubric"
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
      <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#333">${v.value.toFixed(0)}%</text>`
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
    const r = size / 2 - 10
    const cx = size / 2
    const cy = size / 2 + 10
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180)
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180)
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180)
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180)
    const large = pct > 0.5 ? 1 : 0
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${v.color}" stroke="#fff" stroke-width="1"/>
      <text x="${cx + r * 0.6 * Math.cos(((startAngle + endAngle) / 2 * Math.PI) / 180)}" y="${cy + r * 0.6 * Math.sin(((startAngle + endAngle) / 2 * Math.PI) / 180)}" text-anchor="middle" font-size="8" fill="#fff">${(pct * 100).toFixed(0)}%</text>`
  }).join("")
  const legend = values.map((v, i) =>
    `<span style="display:inline-flex;align-items:center;gap:4px;margin:0 8px 4px 0;font-size:10px">
      <span style="display:inline-block;width:10px;height:10px;background:${v.color};border-radius:2px"></span>${escapeHtml(v.label)}</span>`
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
    const school = await getSchoolInfo()

    let query = (ADMIN().from("supervisions") as any)
      .select("*, teacher:teacher_id(id, full_name)")
      .order("observation_date", { ascending: false })

    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      query = query.eq("principal_id", user.id)
      if (level === "JHS") query = query.in("grade", [7, 8, 9])
      else if (level === "SHS") query = query.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      query = query.eq("teacher_id", user.id)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const items = data ?? []

    if (format === "xlsx") {
      const wb = XLSX.utils.book_new()
      const rows = [["Teacher", "Grade", "Subject", "Class", "Date", "Status", "Principal Signature", "Teacher Signature"]]
      for (const item of items) {
        rows.push([
          item.teacher?.full_name || "—",
          item.grade ? `G${item.grade}` : "—",
          item.subject || "—",
          item.class_name || "—",
          new Date(item.observation_date).toLocaleDateString(),
          item.status,
          item.principal_signature || "—",
          item.teacher_signature || "—",
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 30 }, { wch: 30 }]
      XLSX.utils.book_append_sheet(wb, ws, "Supervisions")
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
      return new NextResponse(buf, {
        headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=supervisions-report.xlsx" },
      })
    }

    if (format === "pdf") {
      let rows = ""
      for (const item of items) {
        rows += `<tr>
          <td>${escapeHtml(item.teacher?.full_name || "—")}</td>
          <td>G${item.grade}</td><td>${escapeHtml(item.subject || "—")}</td>
          <td>${item.class_name || "—"}</td>
          <td>${new Date(item.observation_date).toLocaleDateString()}</td>
          <td>${item.status}</td>
          <td>${renderSig(item.principal_signature)}</td>
          <td>${renderSig(item.teacher_signature)}</td>
        </tr>`
      }

      // Status distribution for chart
      const statusCount: Record<string, number> = {}
      for (const item of items) { statusCount[item.status] = (statusCount[item.status] || 0) + 1 }
      const statusChartData = Object.entries(statusCount).map(([k, v]) => ({
        label: k, value: v, max: Math.max(...Object.values(statusCount), 1),
      }))
      const statusChart = svgBarChart(statusChartData)

      // Grade distribution pie
      const gradeCount: Record<string, number> = {}
      for (const item of items) { const g = `G${item.grade}`; gradeCount[g] = (gradeCount[g] || 0) + 1 }
      const gradePieData = Object.entries(gradeCount).map(([k, v], i) => ({
        label: k, value: v, color: CHART_COLORS[i % CHART_COLORS.length],
      }))
      const gradePie = svgPieChart(gradePieData)

      const logoHtml = school.logoUrl ? `<img src="${escapeHtml(school.logoUrl)}" style="height:48px;margin-right:12px" />` : ""
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supervisions Report</title>
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
<div class="header">${logoHtml}<div><h1>${escapeHtml(school.name)}</h1><p style="margin:2px 0 0;font-size:13px;color:#555">Supervisions Report</p></div></div>
<p class="sub">Generated ${new Date().toLocaleDateString()} · ${items.length} record(s)</p>
<div class="charts">
<div class="chart-box"><h3>Status Distribution</h3>${statusChart}</div>
<div class="chart-box"><h3>Grade Distribution</h3>${gradePie}</div>
</div>
<table><thead><tr><th>Teacher</th><th>G</th><th>Subject</th><th>Class</th><th>Date</th><th>Status</th><th>Principal Signature</th><th>Teacher Signature</th></tr></thead><tbody>${rows}</tbody></table>
<p style="margin-top:16px;font-size:10px;color:#999">${escapeHtml(school.brand)} — Supervisions Report</p>
</body></html>`
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": "attachment; filename=supervisions-report.html" },
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
    return `<img src="${sig}" style="max-width:150px;height:30px" />`
  }
  return escapeHtml(sig)
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}
