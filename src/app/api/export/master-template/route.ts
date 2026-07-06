import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()

    // ── Sheet 1: Users ──
    const users = [
      ["email", "full_name", "role", "grade_assigned"],
      ["budi", "Budi Santoso", "teacher", 10],
      ["ani.putri", "Ani Putri", "student", 7],
      ["siti.rahma", "Siti Rahma", "lab_assistant", ""],
    ]
    const wsUsers = XLSX.utils.aoa_to_sheet(users)
    wsUsers["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 12 }]
    wsUsers["!rows"] = [{ hpt: 20 }, {}, {}, {}]
    XLSX.utils.book_append_sheet(wb, wsUsers, "Users")

    // ── Sheet 2: Subjects ──
    const subjects = [
      ["code", "name", "icon", "sort_order"],
      ["PHY", "Physics", "⚛️", 1],
      ["MAT", "Mathematics", "📐", 2],
      ["CHE", "Chemistry", "🧪", 3],
    ]
    const wsSubjects = XLSX.utils.aoa_to_sheet(subjects)
    wsSubjects["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsSubjects, "Subjects")

    // ── Sheet 3: Classes ──
    const classesData = [
      ["grade", "class_name"],
      [7, "A"],
      [7, "B"],
      [8, "A"],
      [8, "B"],
      [9, "A"],
    ]
    const wsClasses = XLSX.utils.aoa_to_sheet(classesData)
    wsClasses["!cols"] = [{ wch: 10 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsClasses, "Classes")

    // ── Sheet 4: Teacher Assignments ──
    const assignments = [
      ["teacher_email", "grade", "subject_code", "class_name"],
      ["sugeng@shb.sch.id", 10, "PHY", "A"],
      ["sugeng@shb.sch.id", 10, "PHY", "B"],
      ["aji@shb.sch.id", 10, "CHE", "A"],
      ["budi", 11, "MAT", ""],
    ]
    const wsAssign = XLSX.utils.aoa_to_sheet(assignments)
    wsAssign["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 15 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsAssign, "Teacher Assignments")

    // ── Sheet 5: Instructions ──
    const instructions = [
      ["SHEET", "COLUMN", "REQUIRED", "NOTES"],
      ["Users", "email", "YES", "Username → auto-appended @shb.sch.id, or full email"],
      ["Users", "full_name", "YES", "Full name"],
      ["Users", "role", "YES", "super_admin | teacher | lab_assistant | student"],
      ["Users", "grade_assigned", "NO", "Grade 7-12 (required for student & teacher)"],
      [],
      ["Subjects", "code", "YES", "Short code, e.g. PHY, MAT, CHE, BIO, ECO"],
      ["Subjects", "name", "YES", "Full name, e.g. Physics, Mathematics"],
      ["Subjects", "icon", "NO", "Emoji icon, e.g. ⚛️ 📐 🧪"],
      ["Subjects", "sort_order", "NO", "Display order number"],
      [],
      ["Classes", "grade", "YES", "Grade 7-12"],
      ["Classes", "class_name", "YES", "Section letter, e.g. A, B, C"],
      [],
      ["Teacher Assignments", "teacher_email", "YES", "Teacher email or username (auto @shb.sch.id)"],
      ["Teacher Assignments", "grade", "YES", "Grade 7-12"],
      ["Teacher Assignments", "subject_code", "YES", "Subject code from Subjects sheet"],
      ["Teacher Assignments", "class_name", "NO", "Leave blank for all classes, or specify A/B/C"],
      [],
      ["NOTES:"],
      ["- Password auto-generated: SHB-xxxxxx for all users"],
      ["- Duplicate entries are skipped automatically"],
      ["- First row of each sheet is the header — do not remove"],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
    wsInstr["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 55 }]
    XLSX.utils.book_append_sheet(wb, wsInstr, "Instructions")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="master-template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
