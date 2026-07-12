import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { getFallbackCredentials } from "@/lib/supabase/supabase-config"
import { createClient } from "@supabase/supabase-js"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const creds = getFallbackCredentials()
    const admin = createClient(creds.url, creds.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch all teachers + students via REST API
    async function getProfiles(role: string) {
      const r = await fetch(`${creds.url}/rest/v1/profiles?select=id,email,full_name,role,grade_assigned&role=eq.${role}&order=full_name.asc`, {
        headers: { "apikey": creds.serviceKey, "Authorization": `Bearer ${creds.serviceKey}` },
      })
      return r.ok ? r.json() : []
    }

    const [teachers, students] = await Promise.all([getProfiles("teacher"), getProfiles("student")])

    // Fetch teacher assignments
    const aRes = await fetch(`${creds.url}/rest/v1/teacher_assignments?select=*,classes:class_id(id,grade,class_name)&order=grade.asc`, {
      headers: { "apikey": creds.serviceKey, "Authorization": `Bearer ${creds.serviceKey}` },
    })
    const assignments = aRes.ok ? await aRes.json() : []

    const teacherAssignMap: Record<string, any[]> = {}
    for (const a of assignments ?? [])
      (teacherAssignMap[a.teacher_id] ??= []).push(a)

    // Generate + SET passwords via SDK (handles new sb_secret_ key format)
    const pwMap: Record<string, string> = {}
    const errs: string[] = []
    for (const u of [...(teachers ?? []), ...(students ?? [])]) {
      const pw = "SHB-" + Math.random().toString(36).slice(2, 8)
      try {
        const { error: ue } = await admin.auth.admin.updateUserById(u.id, { password: pw })
        if (ue) errs.push(`${u.email}: ${ue.message}`)
        else pwMap[u.id] = pw
      } catch (e: any) { errs.push(`${u.email}: ${e.message}`) }
    }
    if (errs.length) return NextResponse.json({ error: "Password reset errors: " + errs.join(" | ") }, { status: 500 })

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