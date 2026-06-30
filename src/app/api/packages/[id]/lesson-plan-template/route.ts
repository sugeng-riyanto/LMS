import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { fillDOCX, generateLessonPlanMD, generateLessonPlanPDF, DEFAULT_VARS } from "@/lib/templates/lesson-plan"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") ?? "docx"

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, grade_assigned")
      .eq("id", user.id)
      .single() as { data: { role: string; grade_assigned: number | null } | null }

    const { data, error } = await (supabase.from("weekly_packages") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    if (profile?.role === "student" && (data.status !== "published" || data.grade !== profile.grade_assigned)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const lp = (data.lesson_plan as Record<string, unknown>) ?? {}
    const phases = (lp.phases as Array<Record<string, unknown>>) ?? []

    // Fetch school settings for VP/Principal per level
    let vp = "", principal = ""
    try {
      const { data: school } = await (supabase.from("school_settings") as any).select("*").eq("id", 1).single()
      if (school) {
        const isJHS = data.grade <= 9
        vp = isJHS ? (school.vp_name ?? "") : (school.shs_vp_name ?? school.vp_name ?? "")
        principal = isJHS ? (school.principal_name ?? "") : (school.shs_principal_name ?? school.principal_name ?? "")
      }
    } catch {}

    const vars = {
      ...DEFAULT_VARS,
      grade: data.grade, week: data.week_number, vp, principal,
      subject: "Physics",
      ssbat: `Students will be able to analyse and apply concepts related to ${data.topic ?? "physics"} in accordance with the Cambridge curriculum.`,
      activities: phases.map((p: Record<string, unknown>) => `${p.phase} (${p.minutes} min): ${p.activity}`).join("\n") || DEFAULT_VARS.activities,
      opening: (phases[0]?.hook_question ? `Hook question: ${phases[0].hook_question}\n${phases[0].activity}` : DEFAULT_VARS.opening) as string,
      assessment: `Formative assessment through Level 1-3 worksheet and CER challenge on ${data.topic ?? "physics"}`,
      resources: data.syllabus_ref ?? "Cambridge Physics curriculum",
    }

    const level = data.grade <= 9 ? "JHS" : "SHS"

    switch (format) {
      case "md": {
        const md = generateLessonPlanMD(vars)
        return new NextResponse(md, {
          headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${level}-G${data.grade}-W${data.week_number}.md"` },
        })
      }
      case "pdf": {
        const buf = await generateLessonPlanPDF(vars)
        return new NextResponse(new Uint8Array(buf), {
          headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${level}-G${data.grade}-W${data.week_number}.pdf"` },
        })
      }
      default: {
        const buf = await fillDOCX(vars)
        return new NextResponse(new Uint8Array(buf), {
          headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${level}-G${data.grade}-W${data.week_number}-lesson-plan.docx"` },
        })
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
