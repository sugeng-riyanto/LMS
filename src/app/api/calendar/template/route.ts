import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()
    const data = [
      { academic_year: "2026-2027", semester: 1, month: 7, week_number: 1, start_date: "2026-07-13", end_date: "2026-07-17", effective_days: 5, event_name: "", event_type: "normal", affected_grades: "7,8,9,10,11,12", is_holiday: false, notes: "" },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const notes = [
      ["INSTRUCTIONS:"],
      ["academic_year", "e.g. 2026-2027"],
      ["semester", "1 or 2"],
      ["month", "1-12"],
      ["week_number", "1-43"],
      ["start_date", "YYYY-MM-DD"],
      ["end_date", "YYYY-MM-DD"],
      ["effective_days", "Teaching days this week"],
      ["event_name", "Event description"],
      ["event_type", "normal / holiday / exam / tryout / mock_test / offsite / blackout / pd_day"],
      ["affected_grades", "Comma-separated: 7,8,9,10,11,12"],
      ["is_holiday", "true or false"],
      ["notes", "Optional"],
    ]
    XLSX.utils.sheet_add_aoa(ws, notes, { origin: "A4" })
    ws["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, ws, "Calendar Events")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="calendar-template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
