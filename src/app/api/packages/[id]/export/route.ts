import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import type { WeeklyPackage } from "@/types/package"
import { generateMD, generateQMD, generateDOCX, generatePDF } from "@/lib/export"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") ?? "md"
    const section = searchParams.get("section") ?? "all"

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

    const pkg: WeeklyPackage = { ...data, title: data.topic ?? "", week: data.week_number }

    // Get school name for branding
    let schoolName = ""
    try {
      const { data: school } = await (supabase.from("school_settings") as any).select("school_name").eq("id", 1).single()
      schoolName = school?.school_name ?? ""
    } catch {}

    if (section !== "all") {
      const sectionKeys = ["lesson-plan", "worksheet", "pre-class", "lab-logistics", "wa-blast", "answer-keys"] as const
      if (!sectionKeys.includes(section as any)) {
        return NextResponse.json({ error: `Invalid section: ${section}` }, { status: 400 })
      }
    }

    let content: string | Buffer
    let contentType: string
    let filename: string

    switch (format) {
      case "md": {
        content = generateMD(pkg, schoolName)
        contentType = "text/markdown; charset=utf-8"
        filename = `grade-${pkg.grade}-week-${pkg.week_number}.md`
        break
      }
      case "qmd": {
        content = generateQMD(pkg, schoolName)
        contentType = "text/markdown; charset=utf-8"
        filename = `grade-${pkg.grade}-week-${pkg.week_number}.qmd`
        break
      }
      case "docx": {
        content = await generateDOCX(pkg, schoolName)
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = `grade-${pkg.grade}-week-${pkg.week_number}.docx`
        break
      }
      case "pdf": {
        content = await generatePDF(pkg, schoolName)
        contentType = "application/pdf"
        filename = `grade-${pkg.grade}-week-${pkg.week_number}.pdf`
        break
      }
      default:
        return NextResponse.json({ error: `Unsupported format: ${format}` }, { status: 400 })
    }

    const body = Buffer.isBuffer(content) ? new Uint8Array(content) : content
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
