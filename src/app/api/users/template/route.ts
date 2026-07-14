import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()

    const data = [
      ["email", "full_name", "role", "grade_assigned", "class_name", "subjects"],
      ["budi", "Budi Santoso", "teacher", 10, "", "PHY, MAT"],
      ["ani.putri", "Ani Putri", "student", 7, "A", ""],
      ["siti.rahma", "Siti Rahma", "lab_assistant", "", "", ""],
    ]
    const wsData = XLSX.utils.aoa_to_sheet(data)
    wsData["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsData, "Data")

    const instructions = [
      ["COLUMN", "REQUIRED", "DESCRIPTION", "EXAMPLE"],
      ["email", "YES", "Username (auto-appended @shb.sch.id) or full email", "budi"],
      ["full_name", "YES", "Full name", "Budi Santoso"],
      ["role", "YES", "super_admin | teacher | lab_assistant | student | principal", "teacher"],
      ["grade_assigned", "NO", "Grade 7-12 (required for student & teacher)", "10"],
      ["class_name", "NO", "Parallel class: A, B, C, etc. Must exist in Classes tab", "A"],
      ["subjects", "NO", "For teachers only. Comma-separated codes. Auto-creates assignments", "PHY, MAT"],
      [],
      ["NOTES:"],
      ["- email: just type username (e.g. budi) -> auto becomes budi@shb.sch.id. Or use full email."],
      ["- Password auto-generated: SHB-xxxxxx (users must change on first login)"],
      ["- Role values: super_admin, teacher, lab_assistant, student, principal (lowercase)"],
      ["- grade_assigned: 7-12 for students/teachers"],
      ["- class_name: parallel class - must be created in Settings > Classes first"],
      ["- subjects: for teachers only. Comma-separated subject codes (e.g. PHY, MAT, CHE)"],
      ["- Duplicate emails are skipped automatically"],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
    wsInstr["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 55 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions")

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
