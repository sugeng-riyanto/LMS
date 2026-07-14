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
      ["eko.pras", "Eko Prasetyo", "principal", "", "", ""],
      ["rina.dewi", "Rina Dewi", "student", 8, "B", ""],
      ["agus", "Agus Wijaya", "teacher", 11, "", "CHE, BIO"],
    ]
    const wsData = XLSX.utils.aoa_to_sheet(data)
    wsData["!cols"] = [{ wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsData, "Data")

    const instructions = [
      ["COLUMN", "WAJIB", "DESKRIPSI", "CONTOH"],
      ["email", "YA", "Username atau email lengkap (auto @shb.sch.id)", "budi"],
      ["full_name", "YA", "Nama lengkap", "Budi Santoso"],
      ["role", "YA", "super_admin | teacher | lab_assistant | student | principal", "teacher"],
      ["grade_assigned", "TIDAK", "Grade 7-12 (wajib untuk student & teacher)", "10"],
      ["class_name", "TIDAK", "Kelas paralel (A, B, C). Harus ada di Settings > Classes", "A"],
      ["subjects", "TIDAK", "Kode subject pisah koma. Untuk teacher auto bikin assignments", "PHY, MAT"],
      [],
      ["PANDUAN ROLE:"],
      ["- teacher: isi grade_assigned + subjects -> auto masuk teacher_assignments"],
      ["- student: isi grade_assigned + class_name -> auto map ke kelas paralel"],
      ["- principal: isi saja email+full_name+role. Lalu assign level di Settings > RBAC"],
      ["- super_admin / lab_assistant: cukup email+full_name+role"],
      [],
      ["CATATAN:"],
      ["- email cukup username -> auto jadi username@shb.sch.id"],
      ["- Password auto: SHB-xxxxxx (ganti pas login pertama)"],
      ["- class_name harus sudah dibuat di Settings > Classes"],
      ["- subjects hanya untuk teacher: PHY, MAT, CHE, BIO, ECO, IND, dll"],
      ["- Duplicate email otomatis di-skip"],
    ]
    const wsInstr = XLSX.utils.aoa_to_sheet(instructions)
    wsInstr["!cols"] = [{ wch: 18 }, { wch: 10 }, { wch: 65 }, { wch: 25 }]
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
