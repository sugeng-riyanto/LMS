import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const grade = searchParams.get("grade")

    let query = (supabase.from("weekly_hours") as any).select("*").order("subject_code").order("grade")
    if (subject) query = query.eq("subject_code", subject)
    if (grade) query = query.eq("grade", parseInt(grade))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    if (!body.subject_code || !body.grade || !body.hours) {
      return NextResponse.json({ error: "subject_code, grade, and hours are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("weekly_hours") as any)
      .upsert({ subject_code: body.subject_code.toUpperCase(), grade: body.grade, hours: body.hours },
        { onConflict: "subject_code,grade" })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
