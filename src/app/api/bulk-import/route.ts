import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

function makeEmail(name: string): string {
  const clean = name.split(",")[0].trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z.0-9]/g, "")
  return `${clean}@shb.sch.id`
}

function toGrade(str: string): number | null {
  const n = parseInt(str)
  return n >= 7 && n <= 12 ? n : null
}

function toClass(str: string): string {
  const m = str.match(/[A-Za-z]+/)
  return m ? m[0] : ""
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(r => r.trim())
    if (lines.length < 2) return NextResponse.json({ error: "CSV is empty" }, { status: 400 })

    // Parse CSV respecting quoted fields
    function parseCSVLine(line: string): string[] {
      const result: string[] = []
      let current = ""
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes; continue }
        if (ch === ";" && !inQuotes) { result.push(current.trim()); current = ""; continue }
        current += ch
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const hMap: Record<string, number> = {}
    headers.forEach((h, i) => { hMap[h.toLowerCase().replace(/[^a-z_]/g, "")] = i })

    const admin = createAdminClient()
    const results: { type: string; name: string; status: string; error?: string }[] = []
    const validRoles = ["super_admin", "teacher", "lab_assistant", "student", "principal"]

    for (let r = 1; r < lines.length; r++) {
      const cols = parseCSVLine(lines[r])

      // Use header map to resolve columns (fall back to hardcoded index for backward compat)
      const email = (cols[hMap["email"] ?? hMap["username"] ?? 0] || "").trim()
      const fullName = (cols[hMap["full_name"] ?? hMap["name"] ?? 1] || "").trim()
      const role = (cols[hMap["role"] ?? 2] || "").trim().toLowerCase()
      const gradeAssigned = (cols[hMap["grade_assigned"] ?? hMap["grade"] ?? 3] || "").trim()
      const code = (cols[hMap["code"] ?? 4] || "").trim()
      const subjName = (cols[hMap["name"] ?? hMap["subject_name"] ?? 5] || "").trim()
      const icon = (cols[hMap["icon"] ?? 6] || "").trim()
      const sortOrder = (cols[hMap["sort_order"] ?? 7] || "").trim()
      const grade = (cols[hMap["grade"] ?? hMap["grade_assigned"] ?? 8] || "").trim()
      const className = (cols[hMap["class_name"] ?? hMap["class"] ?? 9] || "").trim()

      // SUBJECT row
      if (code && subjName) {
        try {
          const { error } = await (admin.from("subjects") as any)
            .upsert({ code: code.toUpperCase(), name: subjName, icon: icon || "📚", sort_order: parseInt(sortOrder) || 0 }, { onConflict: "code" })
          results.push({ type: "subject", name: `${code}: ${subjName}`, status: error ? "failed" : "ok", error: error?.message })
        } catch (e: any) { results.push({ type: "subject", name: subjName, status: "failed", error: e.message }) }
        continue
      }

      // CLASS row
      if (grade && className) {
        const g = toGrade(grade)
        if (!g) { results.push({ type: "class", name: `${grade} ${className}`, status: "skipped", error: "invalid grade" }); continue }
        try {
          const { error } = await (admin.from("classes") as any)
            .upsert({ grade: g, class_name: className.toUpperCase() }, { onConflict: "grade,class_name" })
          results.push({ type: "class", name: `Grade ${g} ${className}`, status: error ? "failed" : "ok", error: error?.message })
        } catch (e: any) { results.push({ type: "class", name: `${grade} ${className}`, status: "failed", error: e.message }) }
        continue
      }

      // USER row — skip if no name
      if (!fullName) continue
      if (!validRoles.includes(role)) { results.push({ type: "user", name: fullName, status: "skipped", error: `invalid role "${role}"` }); continue }

      const userEmail = email || makeEmail(fullName)
      const g = toGrade(gradeAssigned)
      const cls = toClass(gradeAssigned)
      const tempPw = "SHB-" + Math.random().toString(36).slice(2, 8)

      try {
        const { data: authUser, error: signUpError } = await admin.auth.admin.createUser({
          email: userEmail,
          password: tempPw,
          email_confirm: true,
          user_metadata: { full_name: fullName, role },
          app_metadata: { role, full_name: fullName },
        })
        if (signUpError) { results.push({ type: "user", name: fullName, status: "failed", error: signUpError.message }); continue }

        if (authUser?.user) {
          const { error: profileError } = await (admin.from("profiles") as any).upsert({
            id: authUser.user.id,
            email: userEmail,
            full_name: fullName,
            role,
            grade_assigned: g,
            class_name: cls || null,
            is_active: true,
          })
          results.push({ type: "user", name: fullName, status: profileError ? "partial" : "ok", error: profileError?.message })
        }
      } catch (e: any) { results.push({ type: "user", name: fullName, status: "failed", error: e.message }) }
    }

    const summary = {
      total: results.length,
      ok: results.filter(r => r.status === "ok").length,
      skipped: results.filter(r => r.status === "skipped").length,
      failed: results.filter(r => r.status === "failed").length,
      partial: results.filter(r => r.status === "partial").length,
    }

    return NextResponse.json({ summary, results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
