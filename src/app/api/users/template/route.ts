import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()

    const template = [
      { email: "", full_name: "", role: "teacher", grade_assigned: 10 },
    ]
    const notes = [
      { A: "FILLING INSTRUCTIONS:", B: "", C: "", D: "" },
      { A: "email", B: "User email (required, must be unique)", C: "example: teacher@shb.sch.id", D: "" },
      { A: "full_name", B: "Full name (required)", C: "example: Budi Santoso", D: "" },
      { A: "role", B: "User role", C: "super_admin / teacher / lab_assistant / student", D: "" },
      { A: "grade_assigned", B: "Grade (for student & teacher only)", C: "7 / 8 / 9 / 10 / 11 / 12 or leave blank", D: "" },
    ]

    const wsData = XLSX.utils.json_to_sheet(template)
    XLSX.utils.sheet_add_aoa(wsData, [["email", "full_name", "role", "grade_assigned"]], { origin: "A1" })
    XLSX.utils.sheet_add_aoa(wsData, notes.map((n) => [n.A, n.B, n.C, n.D]), { origin: "A4" })

    wsData["!cols"] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 15 }]
    const merge = [
      { s: { r: 3, c: 0 }, e: { r: 3, c: 3 } },
    ]
    wsData["!merges"] = merge

    XLSX.utils.book_append_sheet(wb, wsData, "Template Users")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="user-template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
