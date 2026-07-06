import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()

    const template = [
      { teacher_email: "", grade: 10, subject_code: "PHY", class_name: "A" },
    ]
    const notes = [
      { A: "FILLING INSTRUCTIONS:", B: "", C: "", D: "" },
      { A: "teacher_email", B: "Teacher email (must match existing user)", C: "example: sugeng@shb.sch.id", D: "" },
      { A: "grade", B: "Grade (7-12)", C: "7 / 8 / 9 / 10 / 11 / 12", D: "" },
      { A: "subject_code", B: "Subject code from Subjects table", C: "PHY / MAT / CHE / BIO / ECO", D: "" },
      { A: "class_name", B: "Optional - class section (A/B/C) or leave blank for all", C: "A / B / C or blank", D: "" },
    ]

    const wsData = XLSX.utils.json_to_sheet(template)
    XLSX.utils.sheet_add_aoa(wsData, [["teacher_email", "grade", "subject_code", "class_name"]], { origin: "A1" })
    XLSX.utils.sheet_add_aoa(wsData, notes.map((n) => [n.A, n.B, n.C, n.D]), { origin: "A4" })

    wsData["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 12 }]
    wsData["!merges"] = [{ s: { r: 3, c: 0 }, e: { r: 3, c: 3 } }]

    XLSX.utils.book_append_sheet(wb, wsData, "Template Teacher Assignments")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="teacher-assignments-template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
