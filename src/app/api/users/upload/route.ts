import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
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
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return NextResponse.json({ error: "No sheet found" }, { status: 400 })

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })
    const validRoles = ["super_admin", "teacher", "lab_assistant", "student", "principal"]
    const validGrades = [7, 8, 9, 10, 11, 12]
    const admin = createAdminClient()

    // Pre-fetch classes for mapping
    const { data: classList } = await (admin.from("classes") as any).select("*")
    const classesByGradeAndName = new Map<string, string>()
    if (classList) {
      for (const c of classList) {
        classesByGradeAndName.set(`${c.grade}-${c.class_name}`, c.id)
      }
    }

    const results: { row: number; email: string; full_name?: string; status: string; error?: string; temp_password?: string }[] = []
    let rowNum = 1

    for (const row of rows) {
      rowNum++
      let email = (row.email ?? "").trim()
      const full_name = (row.full_name ?? "").trim()
      const role = (row.role ?? "").trim().toLowerCase()
      const gradeRaw = (row.grade_assigned ?? "").toString().trim()
      const grade = gradeRaw ? parseInt(gradeRaw) : null
      const className = (row.class_name ?? "").toString().trim()
      const classId = grade && className ? classesByGradeAndName.get(`${grade}-${className}`) : null

      if (!full_name) {
        results.push({ row: rowNum, email, status: "skipped", error: "full_name is empty" })
        continue
      }

      // Auto-generate email from full_name if not provided
      if (!email) {
        email = full_name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.0-9]/g, "") + "@shb.sch.id"
      } else {
        if (!email.includes("@")) email += "@shb.sch.id"
        email = email.toLowerCase()
      }
      if (!validRoles.includes(role)) {
        results.push({ row: rowNum, email, status: "skipped", error: `role "${role}" is not valid` })
        continue
      }
      if (grade && !validGrades.includes(grade)) {
        results.push({ row: rowNum, email, status: "skipped", error: `grade ${grade} is not valid` })
        continue
      }

      const tempPassword = "SHB-" + Math.random().toString(36).slice(2, 8)

      try {
        const { data: authUser, error: signUpError } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name, role },
          app_metadata: { role, full_name },
        })

        if (signUpError) {
          const isDuplicate = signUpError.message?.toLowerCase().includes("already been registered")
          results.push({ row: rowNum, email, status: isDuplicate ? "skipped" : "failed", error: signUpError.message })
          continue
        }

        if (authUser?.user) {
          const { error: profileError } = await (admin.from("profiles") as any).upsert({
            id: authUser.user.id,
            email,
            full_name,
            role,
            grade_assigned: grade,
            class_id: classId,
            is_active: true,
          })

          if (profileError) {
            results.push({ row: rowNum, email, status: "partial", error: `Profile: ${profileError.message}` })
          } else {
            // Auto-create teacher_assignments if role is teacher and subjects specified
            if (role === "teacher" && grade && row.subjects) {
              const subjectCodes = row.subjects.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean)
              for (const subjectCode of subjectCodes) {
                try {
                  await (admin.from("teacher_assignments") as any).upsert({
                    teacher_id: authUser.user.id,
                    grade,
                    subject: subjectCode,
                    class_id: classId || null,
                  }, { onConflict: "teacher_id, grade, subject" })
                } catch {}
              }
            }
            results.push({ row: rowNum, email, full_name, status: "created", temp_password: tempPassword })
          }
        }
      } catch (err) {
        results.push({ row: rowNum, email, status: "failed", error: err instanceof Error ? err.message : "Unknown" })
      }
    }

    const created = results.filter((r) => r.status === "created").length
    const partial = results.filter((r) => r.status === "partial").length
    const failed = results.filter((r) => r.status === "failed").length
    const skipped = results.filter((r) => r.status === "skipped").length

    return NextResponse.json({
      message: `${created} created, ${skipped} skipped (duplicate/blank), ${failed} failed, ${partial} partial`,
      results,
      summary: { created, partial, failed, skipped, total: results.length },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
