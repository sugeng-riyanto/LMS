import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

function makePassword(): string {
  return "SHB-" + Math.random().toString(36).slice(2, 8)
}

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const admin = createAdminClient()

    // Fetch all teachers
    const { data: teachers } = await (admin as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "teacher")
      .order("full_name")

    // Fetch all students
    const { data: students } = await (admin as any)
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned")
      .eq("role", "student")
      .order("grade_assigned")
      .order("full_name")

    // Fetch teacher assignments
    const { data: assignments } = await (admin as any)
      .from("teacher_assignments")
      .select("*, classes:class_id(id, grade, class_name)")
      .order("grade")

    // Build teacher→assignments lookup
    const teacherAssignMap: Record<string, any[]> = {}
    for (const a of assignments ?? []) {
      if (!teacherAssignMap[a.teacher_id]) teacherAssignMap[a.teacher_id] = []
      teacherAssignMap[a.teacher_id].push(a)
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Teachers (generate random passwords on the fly)
    const teacherRows: any[][] = [["#", "Name", "Email", "Grade", "Subject", "Class", "Password"]]
    let idx = 1
    for (const t of teachers ?? []) {
      const ta = teacherAssignMap[t.id] ?? []
      const pw = makePassword()
      if (ta.length === 0) {
        teacherRows.push([idx++, t.full_name, t.email, "-", "-", "-", pw])
      } else {
        for (const a of ta) {
          const clsLabel = a.classes ? `Grade ${a.classes.grade}${a.classes.class_name}` : "All classes"
          teacherRows.push([idx++, t.full_name, t.email, `Grade ${a.grade}`, a.subject, clsLabel, pw])
        }
      }
    }
    const wsTeachers = XLSX.utils.aoa_to_sheet(teacherRows)
    wsTeachers["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers")

    // Sheet 2: Students (generate random passwords on the fly)
    const gradeGroups: Record<number, any[]> = {}
    for (const s of students ?? []) {
      const g = s.grade_assigned ?? 0
      if (!gradeGroups[g]) gradeGroups[g] = []
      gradeGroups[g].push(s)
    }

    const studentRows: any[][] = [["#", "Name", "Email", "Grade", "Password"]]
    idx = 1
    const sortedGrades = Object.keys(gradeGroups).sort((a, b) => Number(a) - Number(b))
    for (const g of sortedGrades) {
      for (const s of gradeGroups[Number(g)]) {
        studentRows.push([idx++, s.full_name, s.email, `Grade ${s.grade_assigned}`, makePassword()])
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
      ["Passwords shown are RANDOM — they are NOT yet set in the system"],
      ["To ACTIVATE these passwords, click 'All Passwords' button in Settings → Users"],
      ["That button resets ALL users' passwords and downloads working CSV"],
      ["Users can change password after login via Profile"],
      [],
      ["Teacher assignments managed in Settings → Teachers tab"],
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