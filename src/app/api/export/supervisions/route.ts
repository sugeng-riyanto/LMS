import { NextRequest, NextResponse } from "next/server"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES } from "@/tpa/rubric"
import * as XLSX from "xlsx"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "xlsx"

    let query = (supabase.from("supervisions") as any)
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
      const rows = [["Teacher", "Grade", "Subject", "Class", "Date", "Status", "Principal Signed", "Teacher Signed"]]
      for (const item of items) {
        rows.push([
          item.teacher?.full_name || "—",
          item.grade ? `G${item.grade}` : "—",
          item.subject || "—",
          item.class_name || "—",
          new Date(item.observation_date).toLocaleDateString(),
          item.status,
          item.principal_signature ? "✓" : "—",
          item.teacher_signature ? "✓" : "—",
        ])
      }
      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws["!cols"] = [{ wch: 25 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 16 }]
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
          <td>${item.principal_signature ? "✓" : "—"}</td>
          <td>${item.teacher_signature ? "✓" : "—"}</td>
        </tr>`
      }
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Supervisions Report</title>
<style>body{font-family:Inter,sans-serif;margin:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5}</style></head><body>
<h1>Supervisions Report</h1>
<p style="font-size:12px;color:#666">Generated ${new Date().toLocaleDateString()} · ${items.length} record(s)</p>
<table><thead><tr><th>Teacher</th><th>Grade</th><th>Subject</th><th>Class</th><th>Date</th><th>Status</th><th>P.Sign</th><th>T.Sign</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": "attachment; filename=supervisions-report.html" },
      })
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
