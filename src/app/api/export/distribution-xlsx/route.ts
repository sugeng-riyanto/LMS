import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { getFallbackCredentials } from "@/lib/supabase/supabase-config"
import * as XLSX from "xlsx"

function makePassword(): string {
  return "SHB-" + Math.random().toString(36).slice(2, 8)
}

async function resetUserPassword(userId: string): Promise<string | null> {
  const creds = getFallbackCredentials()
  const pw = makePassword()
  try {
    const res = await fetch(`${creds.url}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "apikey": creds.serviceKey,
        "Authorization": `Bearer ${creds.serviceKey}`,
      },
      body: JSON.stringify({ password: pw }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "unknown")
      console.error(`Password reset failed for ${userId}: ${res.status} ${text}`)
      return null
    }
    return pw
  } catch (e) {
    console.error(`Password reset error for ${userId}:`, e)
    return null
  }
}

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const creds = getFallbackCredentials()
    const supabaseUrl = creds.url
    const supabaseServiceKey = creds.serviceKey

    // Fetch all teachers and students via raw fetch (bypasses any SDK issues)
    async function fetchProfilesByRole(role: string) {
      const res = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,email,full_name,role,grade_assigned&role=eq.${role}&order=full_name.asc`, {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
        },
      })
      if (!res.ok) return []
      return res.json()
    }

    const [teachers, students] = await Promise.all([
      fetchProfilesByRole("teacher"),
      fetchProfilesByRole("student"),
    ])

    // Fetch teacher assignments
    const assignRes = await fetch(`${supabaseUrl}/rest/v1/teacher_assignments?select=*,classes:class_id(id,grade,class_name)&order=grade.asc`, {
      headers: {
        "apikey": supabaseServiceKey,
        "Authorization": `Bearer ${supabaseServiceKey}`,
      },
    })
    const assignments = assignRes.ok ? await assignRes.json() : []

    // Build teacher lookup
    const teacherAssignMap: Record<string, any[]> = {}
    for (const a of assignments ?? []) {
      if (!teacherAssignMap[a.teacher_id]) teacherAssignMap[a.teacher_id] = []
      teacherAssignMap[a.teacher_id].push(a)
    }

    // Reset passwords via raw fetch (GoTrue admin API)
    const pwMap: Record<string, string> = {}
    const allUsers = [...(teachers ?? []), ...(students ?? [])]
    for (const u of allUsers) {
      const pw = await resetUserPassword(u.id)
      if (pw) pwMap[u.id] = pw
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Teachers
    const teacherRows: any[][] = [["#", "Name", "Email", "Grade", "Subject", "Class", "Password"]]
    let idx = 1
    for (const t of teachers ?? []) {
      const ta = teacherAssignMap[t.id] ?? []
      const pw = pwMap[t.id] || "SHB-xxxxxx"
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

    // Sheet 2: Students
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
        const pw = pwMap[s.id] || "SHB-xxxxxx"
        studentRows.push([idx++, s.full_name, s.email, `Grade ${s.grade_assigned}`, pw])
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
      ["Passwords are REAL and usable — already set in the system"],
      ["Users can change password after login via Profile → Change Password"],
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