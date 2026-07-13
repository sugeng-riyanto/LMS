import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole, getPrincipalLevel } from "@/lib/supabase/require-role"

const ADMIN = () => createAdminClient()

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError

    // Get weight settings (default 70% principal, 30% teacher)
    let principalWeight = 70
    let teacherWeight = 30
    let scale = "0-4"
    try {
      const connectionString = process.env.SUPABASE_DB_CONNECTION
      if (connectionString) {
        const { Pool } = await import("pg")
        const pool = new Pool({ connectionString, max: 1 })
        try {
          await pool.query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_principal_weight INT DEFAULT 70`)
          await pool.query(`ALTER TABLE public.school_settings ADD COLUMN IF NOT EXISTS tpa_teacher_weight INT DEFAULT 30`)
          await pool.query(`INSERT INTO public.school_settings (id, school_name) VALUES (1, 'SHB') ON CONFLICT (id) DO NOTHING`)
          const { rows } = await pool.query(`SELECT tpa_principal_weight, tpa_teacher_weight, assessment_scale FROM public.school_settings WHERE id = 1`)
          if (rows[0]?.tpa_principal_weight != null) principalWeight = rows[0].tpa_principal_weight
          if (rows[0]?.tpa_teacher_weight != null) teacherWeight = rows[0].tpa_teacher_weight
          if (rows[0]?.assessment_scale) scale = rows[0].assessment_scale
        } finally { await pool.end() }
      }
    } catch {}

    // Fetch TPA records
    let tpaQuery = (ADMIN().from("teacher_performance_assessments") as any)
      .select("*, teacher:teacher_id(id, full_name), principal:principal_id(id, full_name)")
      .order("created_at", { ascending: false })

    if (profile.role === "principal") {
      const level = await getPrincipalLevel(supabase, user.id)
      tpaQuery = tpaQuery.eq("principal_id", user.id)
      if (level === "JHS") tpaQuery = tpaQuery.in("grade", [7, 8, 9])
      else if (level === "SHS") tpaQuery = tpaQuery.in("grade", [10, 11, 12])
    } else if (profile.role === "teacher") {
      tpaQuery = tpaQuery.eq("teacher_id", user.id)
    }

    const { data: tpaRecords } = await tpaQuery
    const records = tpaRecords ?? []

    // Group by teacher
    const byTeacher: Record<string, {
      teacher_id: string
      teacher_name: string
      assessments: any[]
      total_principal: number
      total_teacher: number
      count: number
    }> = {}

    for (const r of records) {
      const tid = r.teacher_id
      if (!byTeacher[tid]) {
        byTeacher[tid] = {
          teacher_id: tid,
          teacher_name: r.teacher?.full_name || "Unknown",
          assessments: [],
          total_principal: 0,
          total_teacher: 0,
          count: 0,
        }
      }
      byTeacher[tid].assessments.push({
        id: r.id,
        period: r.period_label || `${r.period_type} ${r.semester}`,
        period_type: r.period_type,
        semester: r.semester,
        academic_year: r.academic_year,
        principal_score: r.principal_total ?? null,
        teacher_score: r.teacher_total ?? null,
        combined: r.combined_total ?? null,
        status: r.status,
        subject: r.subject,
        grade: r.grade,
        class_name: r.class_name,
        created_at: r.created_at,
      })
      if (r.principal_total != null) byTeacher[tid].total_principal += r.principal_total
      if (r.teacher_total != null) byTeacher[tid].total_teacher += r.teacher_total
      if (r.combined_total != null) byTeacher[tid].count++
    }

    const result = Object.values(byTeacher).map(t => {
      const principalAvg = t.total_principal / Math.max(t.assessments.filter(a => a.principal_score != null).length, 1)
      const teacherAvg = t.total_teacher / Math.max(t.assessments.filter(a => a.teacher_score != null).length, 1)
      const weightedTotal = (principalAvg * principalWeight / 100) + (teacherAvg * teacherWeight / 100)
      return {
        teacher_id: t.teacher_id,
        teacher_name: t.teacher_name,
        assessments: t.assessments,
        total_assessments: t.assessments.length,
        completed: t.assessments.filter(a => a.status === "completed").length,
        avg_principal: Math.round(principalAvg * 10) / 10,
        avg_teacher: Math.round(teacherAvg * 10) / 10,
        weighted_total: Math.round(weightedTotal * 10) / 10,
        principal_weight: principalWeight,
        teacher_weight: teacherWeight,
      }
    }).sort((a, b) => b.weighted_total - a.weighted_total)

    return NextResponse.json({
      teachers: result,
      weights: { principal: principalWeight, teacher: teacherWeight, scale },
      total: result.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
