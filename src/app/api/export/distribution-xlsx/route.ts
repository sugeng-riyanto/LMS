import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    // Fetch all teachers with their assignments
    const { data: teachers } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "teacher")
      .order("full_name")

    // Fetch teacher assignments with class info
    const { data: assignments } = await (supabase as any)
      .from("teacher_assignments")
      .select("*, classes:class_id(id, grade, class_name)")
      .order("grade")

    // Build teacher lookup
    const teacherAssignMap: Record<string, any[]> = {}
    for (const a of assignments ?? []) {
      if (!teacherAssignMap[a.teacher_id]) teacherAssignMap[a.teacher_id] = []
      teacherAssignMap[a.teacher_id].push(a)
    }

    // Students
    const { data: students } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "student")
      .order("grade_assigned")
      .order("full_name")

    const wb = XLSX.utils.book_new()

    // Sheet 1: Teachers
    const teacherRows: any[][] = [["#", "Name", "Email", "Grade", "Subject", "Class", "Default Password"]]
    let idx = 1
    for (const t of teachers ?? []) {
      const ta = teacherAssignMap[t.id] ?? []
      if (ta.length === 0) {
        teacherRows.push([idx++, t.full_name, t.email, "-", "-", "-", "SHB-xxxxxx"])
      } else {
        for (const a of ta) {
          const clsLabel = a.classes ? `Grade ${a.classes.grade}${a.classes.class_name}` : "All classes"
          teacherRows.push([idx++, t.full_name, t.email, `Grade ${a.grade}`, a.subject, clsLabel, "SHB-xxxxxx"])
        }
      }
    }
    const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows)
    wsTeachers["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers")

    // Sheet 2: Students
    const gradeGroups: Record<number, any[]> = {}
    for (const s of students ?? []) {
      const g = s.grade_assigned ?? 0
      if (!gradeGroups[g]) gradeGroups[g] = []
      gradeGroups[g].push(s)
    }

    const studentRows: any[][] = [["#", "Name", "Email", "Grade", "Default Password"]]
    idx = 1
    const sortedGrades = Object.keys(gradeGroups).sort((a, b) => Number(a) - Number(b))
    for (const g of sortedGrades) {
      for (const s of gradeGroups[Number(g)]) {
        studentRows.push([idx++, s.full_name, s.email, `Grade ${s.grade_assigned}`, "SHB-xxxxxx"])
      }
    }
    const wsStudents = XLSX.utils.aoa_to_sheet(studentRows)
    wsStudents["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsStudents, "Students")

    // Sheet 3: Summary
    const totalTeachers = (teachers ?? []).length
    const totalStudents = (students ?? []).length
    const summaryRows: any[][] = [
      ["TEACHER & STUDENT DISTRIBUTION"],
      [],
      ["Total Teachers", totalTeachers],
      ["Total Students", totalStudents],
      ["Total Users", totalTeachers + totalStudents],
      [],
      ["Grade", "Teachers", "Students"],
    ]
    for (const g of sortedGrades) {
      const gNum = Number(g)
      const teacherCount = (teachers ?? []).filter((t: any) => {
        const ta = teacherAssignMap[t.id] ?? []
        return ta.some((a: any) => a.grade === gNum)
      }).length
      const studentCount = (gradeGroups[gNum] ?? []).length
      summaryRows.push([`Grade ${g}`, teacherCount, studentCount])
    }
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary["!cols"] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary")

    // Sheet 4: Notes
    const notes = [
      ["NOTES"],
      [],
      ["Default Password: SHB-xxxxxx (auto-generated for all users)"],
      ["Users must change password on first login via Profile → Security tab"],
      ["Forgot password: use /forgot-password page"],
      ["Super admin can reset any user's password from Settings → Users → Reset PW"],
      [],
      ["Teacher assignments managed in Settings → Teachers tab"],
      ["Student grade assignments managed in Settings → Users → Edit"],
    ]
    const wsNotes = XLSX.utils.aoa_to_sheet(notes)
    wsNotes["!cols"] = [{ wch: 60 }]
    XLSX.utils.book_append_sheet(wb, wsNotes, "Notes")

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
