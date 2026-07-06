import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()

    const data = [
      ["email", "full_name", "role", "grade_assigned"],
      ["teacher@shb.sch.id", "Budi Santoso", "teacher", 10],
      ["student7@shb.sch.id", "Ani Putri", "student", 7],
      ["lab@shb.sch.id", "Siti Rahma", "lab_assistant", ""],
    ]
    const wsData = XLSX.utils.aoa_to_sheet(data)
    wsData["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 18 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsData, "Data")

    const instructions = [
      ["COLUMN", "REQUIRED", "DESCRIPTION", "EXAMPLE"],
      ["email", "YES", "Unique email address", "teacher@shb.sch.id"],
      ["full_name", "YES", "Full name", "Budi Santoso"],
      ["role", "YES", "super_admin | teacher | lab_assistant | student", "teacher"],
      ["grade_assigned", "NO", "Grade 7-12 (required for student & teacher)", "10"],
      [],
      ["NOTES:"],
      ["- First row (header) must match: email, full_name, role, grade_assigned"],
      ["- Role values: super_admin, teacher, lab_assistant, student (lowercase)"],
      ["- grade_assigned: 7-12 for students/teachers, leave blank for super_admin/lab_assistant"],
      ["- Temporary password auto-generated: SHB-xxxxxx"],
      ["- Duplicate emails are skipped automatically"],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
    wsInstr["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 50 }, { wch: 25 }]
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
