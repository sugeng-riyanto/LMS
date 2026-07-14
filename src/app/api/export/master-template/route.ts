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
      ["email", "full_name", "role", "grade_assigned", "class_name", "subjects"],
      ["budi", "Budi Santoso", "teacher", 10, "", "PHY, MAT"],
      ["ani.putri", "Ani Putri", "student", 7, "A", ""],
      ["siti.rahma", "Siti Rahma", "lab_assistant", "", "", ""],
      ["eko.pras", "Eko Prasetyo", "principal", "", "", ""],
    ]
    const wsUsers = XLSX.utils.aoa_to_sheet(users)
    wsUsers["!cols"] = [{ wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 20 }]
    wsUsers["!rows"] = [{ hpt: 20 }, {}, {}, {}, {}]
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
      ["SHEET", "COLUMN", "WAJIB", "NOTES"],
      ["Users", "email", "YA", "Username → auto @shb.sch.id, atau email lengkap"],
      ["Users", "full_name", "YA", "Nama lengkap"],
      ["Users", "role", "YA", "super_admin | teacher | lab_assistant | student | principal"],
      ["Users", "grade_assigned", "TIDAK", "Grade 7-12 (wajib untuk student & teacher)"],
      ["Users", "class_name", "TIDAK", "Kelas paralel (A, B, C). Untuk student"],
      ["Users", "subjects", "TIDAK", "Kode subject pisah koma. Untuk teacher auto assignment"],
      [],
      ["Subjects", "code", "YA", "Kode pendek, e.g. PHY, MAT, CHE, BIO, ECO"],
      ["Subjects", "name", "YA", "Nama lengkap, e.g. Physics, Mathematics"],
      ["Subjects", "icon", "TIDAK", "Emoji icon, e.g. ⚛️ 📐 🧪"],
      ["Subjects", "sort_order", "TIDAK", "Nomor urut tampilan"],
      [],
      ["Classes", "grade", "YA", "Grade 7-12"],
      ["Classes", "class_name", "YA", "Huruf kelas, e.g. A, B, C"],
      [],
      ["Teacher Assignments", "teacher_email", "YA", "Email guru (username atau lengkap)"],
      ["Teacher Assignments", "grade", "YA", "Grade 7-12"],
      ["Teacher Assignments", "subject_code", "YA", "Kode subject dari Subjects sheet"],
      ["Teacher Assignments", "class_name", "TIDAK", "Kosongkan untuk semua kelas, atau isi A/B/C"],
      [],
      ["ALUR UPLOAD:"],
      ["1. Isi semua sheet sesuai data"],
      ["2. Upload file → semua sheet diproses otomatis"],
      ["3. Users → dibuat akun + profile + teacher_assignments jika ada subjects"],
      ["4. Subjects → ditambahkan ke database"],
      ["5. Classes → ditambahkan ke database"],
      ["6. Teacher Assignments → mapping guru ke grade + subject + kelas"],
      [],
      ["NOTE:"],
      ["- Password auto-generated: SHB-xxxxxx untuk semua user"],
      ["- Duplikat otomatis di-skip"],
      ["- Baris pertama setiap sheet adalah header — jangan dihapus"],
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
