import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const grade = formData.get("grade") as string | null
    const subject = formData.get("subject") as string | null

    if (!file || !grade || !subject) {
      return NextResponse.json({ error: "File, grade, and subject are required" }, { status: 400 })
    }

    // Teachers can only upload for their own subjects
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (!subjects.includes(subject)) {
        return NextResponse.json({ error: "You can only upload documents for your assigned subjects" }, { status: 403 })
      }
    }

    const content = await file.text()
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "md"
    const validTypes = ["md", "qmd", "pdf", "xlsx"]
    if (!validTypes.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 })
    }

    const { error } = await (ADMIN().from("syllabus_documents") as any).insert({
      grade: parseInt(grade),
      subject,
      file_name: file.name,
      file_type: ext,
      file_content: ext === "pdf" || ext === "xlsx" ? "[binary file]" : content,
      file_size: file.size,
      uploaded_by: user.id,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: `${file.name} uploaded for Grade ${grade}` })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
