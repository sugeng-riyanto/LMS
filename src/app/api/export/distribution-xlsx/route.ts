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

    // Fetch ALL profiles
    const r = await fetch(`${creds.url}/rest/v1/profiles?select=id,email,full_name,role,grade_assigned,class_id&order=full_name.asc`, {
      headers: { "apikey": creds.serviceKey, "Authorization": `Bearer ${creds.serviceKey}` },
    })
    const allProfiles = r.ok ? await r.json() : []

    // Fetch teacher assignments
    const aRes = await fetch(`${creds.url}/rest/v1/teacher_assignments?select=teacher_id,grade,subject,class_id&order=grade.asc`, {
      headers: { "apikey": creds.serviceKey, "Authorization": `Bearer ${creds.serviceKey}` },
    })
    const assignments = aRes.ok ? await aRes.json() : []

    // Fetch classes for class_name resolution
    const cRes = await fetch(`${creds.url}/rest/v1/classes?select=id,grade,class_name`, {
      headers: { "apikey": creds.serviceKey, "Authorization": `Bearer ${creds.serviceKey}` },
    })
    const allClasses = cRes.ok ? await cRes.json() : []
    const classMap: Record<string, string> = {}
    for (const cls of allClasses ?? []) classMap[cls.id] = `${cls.class_name}`

    // Group assignments by (teacher_id, grade, subject) → class names
    const assignGroups: Record<string, { teacher_id: string; grade: number; subject: string; classes: string[] }[]> = {}
    for (const a of assignments ?? []) {
      const key = `${a.teacher_id}|${a.grade}|${(a.subject || "").toUpperCase()}`
      if (!assignGroups[key]) assignGroups[key] = []
      const existing = assignGroups[key].find(g => g.teacher_id === a.teacher_id && g.grade === a.grade && g.subject === (a.subject || "").toUpperCase())
      if (existing) {
        if (a.class_id && classMap[a.class_id] && !existing.classes.includes(classMap[a.class_id]))
          existing.classes.push(classMap[a.class_id])
      } else {
        assignGroups[key] = [{
          teacher_id: a.teacher_id,
          grade: a.grade,
          subject: (a.subject || "").toUpperCase(),
          classes: a.class_id && classMap[a.class_id] ? [classMap[a.class_id]] : [],
        }]
      }
    }

    // Generate deterministic passwords and persist them to Supabase
    // (same formula as reset-passwords-bulk — always consistent)
    const pwMap: Record<string, string> = {}
    for (const u of allProfiles ?? []) {
      const hash = u.id.replace(/-/g, "").slice(0, 6)
      pwMap[u.id] = "SHB-" + hash
      // Skip persistence for super_admin (keep manual password)
      if (u.role !== "super_admin") {
        try {
          await admin.auth.admin.updateUserById(u.id, { password: pwMap[u.id] })
        } catch {
          // user may not exist in auth — ignore
        }
      }
    }

    const wb = XLSX.utils.book_new()

    // Sheet 1: Users (master-upload compatible format)
    // One row per teacher assignment group, one row per non-teacher user
    const uRows: any[][] = [["email", "full_name", "role", "grade_assigned", "class_name", "subjects", "password"]]
    for (const p of allProfiles ?? []) {
      const pw = pwMap[p.id] ?? ""
      if (p.role === "teacher") {
        const groups = Object.values(assignGroups).filter(g => g[0].teacher_id === p.id)
        if (groups.length === 0) {
          uRows.push([p.email, p.full_name, "teacher", "", "", "", pw])
        } else {
          for (const g of groups) {
            const entry = g[0]
            uRows.push([p.email, p.full_name, "teacher", entry.grade, entry.classes.join(", "), entry.subject, pw])
          }
        }
      } else {
        const className = p.class_id && classMap[p.class_id] ? classMap[p.class_id] : ""
        uRows.push([p.email, p.full_name, p.role, p.grade_assigned ?? "", className, "", pw])
      }
    }
    const wsU = XLSX.utils.aoa_to_sheet(uRows)
    wsU["!cols"] = [{ wch: 28 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, wsU, "Users")

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
