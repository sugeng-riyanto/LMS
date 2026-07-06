import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")
    const fileType = searchParams.get("type")
    const subject = searchParams.get("subject")

    let query = (supabase.from("syllabus_documents") as any).select("*")
    if (grade) query = query.eq("grade", parseInt(grade))
    if (fileType) query = query.eq("file_type", fileType)
    if (subject) query = query.eq("subject", subject)
    // Teachers can only see their own subject's documents
    if (profile?.role === "teacher") {
      const { getTeacherSubjects } = await import("@/lib/supabase/require-role")
      const subjects = await getTeacherSubjects(supabase, user.id)
      if (subjects.length > 0) query = query.in("subject", subjects)
    }
    query = query.order("created_at", { ascending: false })

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
