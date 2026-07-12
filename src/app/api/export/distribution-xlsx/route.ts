import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const admin = createAdminClient()

    // Fetch all teachers + students
    const { data: teachers } = await (admin as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "teacher")
      .order("full_name")

    const { data: students } = await (admin as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "student")
      .order("grade_assigned")
      .order("full_name")

    const { data: assignments } = await (admin as any)
      .from("teacher_assignments")
      .select("*, classes:class_id(id, grade, class_name)")
      .order("grade")

    const teacherAssignMap: Record<string, any[]> = {}
    for (const a of assignments ?? [])
      (teacherAssignMap[a.teacher_id] ??= []).push(a)

    // Generate + set passwords for every teacher and student
    const pwMap: Record<string, string> = {}
    for (const u of [...(teachers ?? []), ...(students ?? [])]) {
      const pw = "SHB-" + Math.random().toString(36).slice(2, 8)
      const { error: e } = await admin.auth.admin.updateUserById(u.id, { password: pw })
      if (!e) pwMap[u.id] = pw
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Teachers
    const tRows: any[][] = [["#", "Name", "Email", "Grade", "Subject", "Class", "Password"]]
    let idx = 1
    for (const t of teachers ?? []) {
      const ta = teacherAssignMap[t.id] ?? []
      const pw = pwMap[t.id] ?? ""
      if (!ta.length) tRows.push([idx++, t.full_name, t.email, "-", "-", "-", pw])
      else for (const a of ta) tRows.push([idx++, t.full_name, t.email, `Grade ${a.grade}`, a.subject, a.classes ? `Grade ${a.classes.grade}${a.classes.class_name}` : "All classes", pw])
    }
    const wsT = XLSX.utils.aoa_to_sheet(tRows)
    wsT["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsT, "Teachers")

    // Sheet 2: Students
    const grps: Record<number, any[]> = {}
    for (const s of students ?? []) (grps[s.grade_assigned ?? 0] ??= []).push(s)
    const sRows: any[][] = [["#", "Name", "Email", "Grade", "Password"]]
    idx = 1
    for (const g of Object.keys(grps).sort((a, b) => Number(a) - Number(b)))
      for (const s of grps[Number(g)]) sRows.push([idx++, s.full_name, s.email, `Grade ${s.grade_assigned}`, pwMap[s.id] ?? ""])
    const wsS = XLSX.utils.aoa_to_sheet(sRows)
    wsS["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsS, "Students")

    // Sheet 3: Summary
    const sumRows: any[][] = [
      ["DISTRIBUTION & PASSWORDS"], [],
      ["Total Teachers", teachers?.length ?? 0],
      ["Total Students", students?.length ?? 0],
      ["Passwords Reset", Object.keys(pwMap).length],
    ]
    const wsSum = XLSX.utils.aoa_to_sheet(sumRows)
    XLSX.utils.book_append_sheet(wb, wsSum, "Summary")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="teacher-student-distribution.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}