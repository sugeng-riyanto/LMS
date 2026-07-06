import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return NextResponse.json({ error: "No sheet found" }, { status: 400 })

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })
    const validRoles = ["super_admin", "teacher", "lab_assistant", "student"]
    const validGrades = [7, 8, 9, 10, 11, 12]

    const results: { row: number; email: string; status: string; error?: string }[] = []
    let rowNum = 1

    for (const row of rows) {
      rowNum++
      let email = (row.email ?? "").trim()
      const full_name = (row.full_name ?? "").trim()
      const role = (row.role ?? "").trim().toLowerCase()
      const gradeRaw = (row.grade_assigned ?? "").toString().trim()
      const grade = gradeRaw ? parseInt(gradeRaw) : null

      // Auto-append @shb.sch.id if no @ sign
      if (email && !email.includes("@")) email += "@shb.sch.id"
      email = email.toLowerCase()

      if (!email || !full_name) {
        results.push({ row: rowNum, email, status: "skipped", error: "email or full_name is empty" })
        continue
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
        const admin = createAdminClient()
        const { data: authUser, error: signUpError } = await admin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name, role },
        })

        if (signUpError) {
          results.push({ row: rowNum, email, status: "failed", error: signUpError.message })
          continue
        }

        if (authUser?.user) {
          const { error: profileError } = await (supabase.from("profiles") as any).upsert({
            id: authUser.user.id,
            email,
            full_name,
            role,
            grade_assigned: grade,
            is_active: true,
          })

          if (profileError) {
            results.push({ row: rowNum, email, status: "partial", error: `Profile: ${profileError.message}` })
          } else {
            results.push({ row: rowNum, email, status: "created", error: undefined })
          }
        }
      } catch (err) {
        results.push({ row: rowNum, email, status: "failed", error: err instanceof Error ? err.message : "Unknown" })
      }
    }

    const created = results.filter((r) => r.status === "created").length
    const partial = results.filter((r) => r.status === "partial").length
    const failed = results.filter((r) => r.status === "failed" || r.status === "skipped").length

    return NextResponse.json({
      message: `Complete: ${created} created, ${partial} partial, ${failed} failed`,
      results,
      summary: { created, partial, failed, total: results.length },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
