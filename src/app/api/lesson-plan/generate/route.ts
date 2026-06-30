import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import { fillDOCX, generateLessonPlanMD, generateLessonPlanQMD, generateLessonPlanPDF, DEFAULT_VARS, type LessonPlanVars } from "@/lib/templates/lesson-plan"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const format = body.format ?? "docx"

    const vars: LessonPlanVars = {
      ...DEFAULT_VARS,
      ...body.vars,
      grade: body.vars?.grade ?? DEFAULT_VARS.grade,
      week: body.vars?.week ?? DEFAULT_VARS.week,
    }

    switch (format) {
      case "docx": {
        const buf = await fillDOCX(vars)
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "Content-Disposition": `attachment; filename="lesson-plan-G${vars.grade}-W${vars.week}.docx"`,
          },
        })
      }
      case "md": {
        const md = generateLessonPlanMD(vars)
        return new NextResponse(md, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="lesson-plan-G${vars.grade}-W${vars.week}.md"`,
          },
        })
      }
      case "qmd": {
        const qmd = generateLessonPlanQMD(vars)
        return new NextResponse(qmd, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="lesson-plan-G${vars.grade}-W${vars.week}.qmd"`,
          },
        })
      }
      case "pdf": {
        const buf = await generateLessonPlanPDF(vars)
        return new NextResponse(new Uint8Array(buf), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="lesson-plan-G${vars.grade}-W${vars.week}.pdf"`,
          },
        })
      }
      default:
        return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
