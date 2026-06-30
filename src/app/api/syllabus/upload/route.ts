import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const grade = formData.get("grade") as string | null

    if (!file || !grade) {
      return NextResponse.json({ error: "File and grade are required" }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const content = buf.toString("utf-8")
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "md"
    const validTypes = ["md", "qmd", "pdf", "xlsx"]
    if (!validTypes.includes(ext)) {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 })
    }

    const { error } = await (supabase.from("syllabus_documents") as any).insert({
      grade: parseInt(grade),
      subject: "Physics",
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
