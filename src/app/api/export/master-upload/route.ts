import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { createAdminClient } from "@/lib/supabase/admin"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer" })
    const admin = createAdminClient()
    const results: string[] = []

    // ── Sheet 1: Users ──
    if (wb.SheetNames.includes("Users")) {
      const ws = wb.Sheets["Users"]
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" })
      let created = 0
      for (const row of rows) {
        if (!row.full_name) continue
        let email = (row.email || "").trim().toLowerCase()
        const full_name = (row.full_name || "").trim()
        const role = (row.role || "").trim().toLowerCase()
        const grade = row.grade_assigned ? parseInt(row.grade_assigned) : null
        const className = (row.class_name || "").toString().trim()
        if (!email) email = full_name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.0-9]/g, "") + "@shb.sch.id"
        else if (!email.includes("@")) email += "@shb.sch.id"

        const password = "SHB-" + Math.random().toString(36).slice(2, 8)
        try {
          const { data: authUser } = await admin.auth.admin.createUser({
            email, password, email_confirm: true,
            user_metadata: { full_name, role },
            app_metadata: { role, full_name },
          })
          if (authUser?.user) {
            // Resolve class_id
            let classId: string | null = null
            if (grade && className) {
              const { data: cls } = await (admin.from("classes") as any).select("id").eq("grade", grade).eq("class_name", className).maybeSingle()
              if (cls) classId = cls.id
            }
            await (admin.from("profiles") as any).upsert({
              id: authUser.user.id, email, full_name, role,
              grade_assigned: grade, class_id: classId, is_active: true,
            })
            // Teacher assignments
            if (role === "teacher" && grade && row.subjects) {
              const codes = row.subjects.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
              for (const code of codes) {
                await (admin.from("teacher_assignments") as any).upsert(
                  { teacher_id: authUser.user.id, grade, subject: code, class_id: classId },
                  { onConflict: "teacher_id, grade, subject" }
                )
              }
            }
            created++
          }
        } catch {}
      }
      results.push(`Users: ${created} created`)
    }

    // ── Sheet 2: Subjects ──
    if (wb.SheetNames.includes("Subjects")) {
      const ws = wb.Sheets["Subjects"]
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" })
      let saved = 0
      for (const row of rows) {
        if (!row.code || !row.name) continue
        const { error } = await (admin.from("subjects") as any).upsert(
          { code: row.code.toUpperCase(), name: row.name, icon: row.icon || "📘", sort_order: row.sort_order || 99 },
          { onConflict: "code" }
        )
        if (!error) saved++
      }
      results.push(`Subjects: ${saved} saved`)
    }

    // ── Sheet 3: Classes ──
    if (wb.SheetNames.includes("Classes")) {
      const ws = wb.Sheets["Classes"]
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" })
      let saved = 0
      for (const row of rows) {
        if (!row.grade || !row.class_name) continue
        const { error } = await (admin.from("classes") as any).upsert(
          { grade: parseInt(row.grade), class_name: row.class_name },
          { onConflict: "grade,class_name" }
        )
        if (!error) saved++
      }
      results.push(`Classes: ${saved} saved`)
    }

    // ── Sheet 4: Teacher Assignments ──
    if (wb.SheetNames.includes("Teacher Assignments")) {
      const ws = wb.Sheets["Teacher Assignments"]
      const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" })
      let saved = 0
      for (const row of rows) {
        if (!row.teacher_email || !row.grade || !row.subject_code) continue
        let email = (row.teacher_email || "").trim().toLowerCase()
        if (!email.includes("@")) email += "@shb.sch.id"
        // Find teacher by email
        const { data: teacher } = await (admin.from("profiles") as any).select("id").eq("email", email).maybeSingle()
        if (!teacher) continue
        let classId: string | null = null
        if (row.class_name) {
          const { data: cls } = await (admin.from("classes") as any).select("id")
            .eq("grade", parseInt(row.grade)).eq("class_name", row.class_name).maybeSingle()
          if (cls) classId = cls.id
        }
        const { error } = await (admin.from("teacher_assignments") as any).upsert(
          { teacher_id: teacher.id, grade: parseInt(row.grade), subject: row.subject_code.toUpperCase(), class_id: classId },
          { onConflict: "teacher_id, grade, subject" }
        )
        if (!error) saved++
      }
      results.push(`Teacher Assignments: ${saved} saved`)
    }

    return NextResponse.json({ message: results.join(" | ") })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
