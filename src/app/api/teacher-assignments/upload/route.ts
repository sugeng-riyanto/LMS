import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
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
    const validGrades = [7, 8, 9, 10, 11, 12]

    // Fetch lookup maps
    const { data: profiles } = await (supabase.from("profiles") as any).select("id, email, role").eq("role", "teacher")
    const emailToId = Object.fromEntries((profiles ?? []).map((p: any) => [p.email.toLowerCase(), p.id]))

    const { data: subjects } = await (supabase.from("subjects") as any).select("code, name")
    const validSubjects = new Set((subjects ?? []).map((s: any) => s.code))

    const { data: classes } = await (supabase.from("classes") as any).select("id, grade, class_name")
    const classKeyToId = Object.fromEntries((classes ?? []).map((c: any) => [`${c.grade}|${c.class_name}`, c.id]))

    const results: { row: number; email: string; status: string; error?: string }[] = []
    let rowNum = 1

    for (const row of rows) {
      rowNum++
      const email = (row.teacher_email ?? "").trim().toLowerCase()
      const gradeRaw = (row.grade ?? "").toString().trim()
      const subjectCode = (row.subject_code ?? "").trim().toUpperCase()
      const className = (row.class_name ?? "").trim().toUpperCase()

      if (!email || !gradeRaw || !subjectCode) {
        results.push({ row: rowNum, email, status: "skipped", error: "teacher_email, grade, and subject_code are required" })
        continue
      }

      const grade = parseInt(gradeRaw)
      if (!validGrades.includes(grade)) {
        results.push({ row: rowNum, email, status: "skipped", error: `grade ${gradeRaw} is not valid` })
        continue
      }

      const teacherId = emailToId[email]
      if (!teacherId) {
        results.push({ row: rowNum, email, status: "skipped", error: `no teacher found with email "${email}"` })
        continue
      }

      if (!validSubjects.has(subjectCode)) {
        results.push({ row: rowNum, email, status: "skipped", error: `subject code "${subjectCode}" is not valid` })
        continue
      }

      let classId = null
      if (className) {
        classId = classKeyToId[`${grade}|${className}`]
        if (!classId) {
          results.push({ row: rowNum, email, status: "skipped", error: `no class found for Grade ${grade} "${className}"` })
          continue
        }
      }

      try {
        const { error: insertError } = await (supabase.from("teacher_assignments") as any).insert({
          teacher_id: teacherId,
          grade,
          subject: subjectCode,
          class_id: classId,
        })

        if (insertError) {
          if (insertError.code === "23505") {
            results.push({ row: rowNum, email, status: "skipped", error: "duplicate assignment already exists" })
          } else {
            results.push({ row: rowNum, email, status: "failed", error: insertError.message })
          }
        } else {
          results.push({ row: rowNum, email, status: "created" })
        }
      } catch (err) {
        results.push({ row: rowNum, email, status: "failed", error: err instanceof Error ? err.message : "Unknown" })
      }
    }

    const created = results.filter((r) => r.status === "created").length
    const failed = results.filter((r) => r.status === "failed" || r.status === "skipped").length

    return NextResponse.json({
      message: `Complete: ${created} created, ${failed} failed`,
      results,
      summary: { created, failed, total: results.length },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
