import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import { TPA_CATEGORIES, calculateTotal, getGradeLabel } from "@/tpa/rubric"

const ADMIN = () => createAdminClient()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError
    const { id } = await params
    const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
      .select("*, teacher:teacher_id(id, full_name), principal:principal_id(id, full_name)")
      .eq("id", id).single()
    if (error || !data) return new NextResponse("Not found", { status: 404 })
    if (profile.role !== "super_admin" && data.principal_id !== user.id && data.teacher_id !== user.id) {
      return new NextResponse("Forbidden", { status: 403 })
    }
    return NextResponse.json(data)
  } catch {
    return new NextResponse("Not found", { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal", "teacher"])
    if (authError) return authError
    const { id } = await params
    const body = await request.json()

    const { data: assmt } = await (ADMIN().from("teacher_performance_assessments") as any).select("*").eq("id", id).single()
    if (!assmt) return new NextResponse("Not found", { status: 404 })

    // === PRINCIPAL ACTIONS ===
    if (profile.role === "principal") {
      if (assmt.principal_id !== user.id) return new NextResponse("Forbidden", { status: 403 })

      // UNPUBLISH — revert from principal_submitted back to draft
      if (body.action === "unpublish") {
        const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
          .update({
            status: "draft",
            unpublished_at: new Date().toISOString(),
            principal_submitted_at: null,
            principal_signature: null,
            principal_signed_at: null,
          }).eq("id", id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      // PUBLISH — submit to teacher (only if has scores)
      if (body.action === "publish" && assmt.status === "draft") {
        if (!assmt.principal_scores && !body.principal_scores) {
          return NextResponse.json({ error: "Fill scores before publishing" }, { status: 400 })
        }
        const scores = body.principal_scores || assmt.principal_scores
        if (!scores) return NextResponse.json({ error: "No scores to publish" }, { status: 400 })

        const categoryScores: Record<string, { raw: number; max: number }> = {}
        for (const cat of TPA_CATEGORIES) {
          const s = scores[cat.key] || {}
          const raw = cat.items.reduce((sum: number, item) => sum + (s[item.id] ?? 0), 0)
          categoryScores[cat.key] = { raw, max: cat.items.length * 4 }
        }
        const total = calculateTotal(categoryScores)

        const now = new Date()
        const day = String(now.getDate()).padStart(2, "0")
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const year = now.getFullYear()
        const hours = String(now.getHours()).padStart(2, "0")
        const minutes = String(now.getMinutes()).padStart(2, "0")
        const seconds = String(now.getSeconds()).padStart(2, "0")
        const dateStr = `Day: ${day}-${month}-${year} Time: ${hours}--${minutes}--${seconds}`
        const principalSig = body.signature_data_url
          ? `${body.signature_data_url}`
          : `Signed by ${profile.full_name} — ${dateStr}`
        const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
          .update({
            principal_scores: scores,
            principal_total: total,
            status: "principal_submitted",
            principal_submitted_at: new Date().toISOString(),
            principal_signature: principalSig,
            principal_signed_at: new Date().toISOString(),
            grade: body.grade ?? assmt.grade,
            subject: body.subject ?? assmt.subject,
            pre_appraisal_held: body.pre_appraisal_held ?? assmt.pre_appraisal_held,
            visit_count: body.visit_count ?? assmt.visit_count,
            period_type: body.period_type ?? assmt.period_type,
            period_label: body.period_label ?? assmt.period_label,
          }).eq("id", id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      // SAVE DRAFT scores
      if (body.principal_scores) {
        const categoryScores: Record<string, { raw: number; max: number }> = {}
        for (const cat of TPA_CATEGORIES) {
          const s = body.principal_scores[cat.key] || {}
          const raw = cat.items.reduce((sum: number, item) => sum + (s[item.id] ?? 0), 0)
          categoryScores[cat.key] = { raw, max: cat.items.length * 4 }
        }
        const total = calculateTotal(categoryScores)

        const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
          .update({
            principal_scores: body.principal_scores,
            principal_total: total,
            grade: body.grade ?? assmt.grade,
            subject: body.subject ?? assmt.subject,
            pre_appraisal_held: body.pre_appraisal_held ?? assmt.pre_appraisal_held,
            visit_count: body.visit_count ?? assmt.visit_count,
            period_type: body.period_type ?? assmt.period_type,
            period_label: body.period_label ?? assmt.period_label,
          }).eq("id", id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }

      // Update basic fields
      const allowed = ["grade", "subject", "pre_appraisal_held", "post_conference_held", "visit_count", "period_type", "period_label", "ai_feedback"]
      const updates: Record<string, unknown> = {}
      for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f]
      const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
        .update(updates).eq("id", id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    // === TEACHER ACTIONS ===
    if (profile.role === "teacher") {
      if (assmt.teacher_id !== user.id) return new NextResponse("Forbidden", { status: 403 })
      if (assmt.status !== "principal_submitted") return new NextResponse("Teacher can only submit after principal", { status: 400 })

      if (body.teacher_scores) {
        const categoryScores: Record<string, { raw: number; max: number }> = {}
        for (const cat of TPA_CATEGORIES) {
          const scores = body.teacher_scores[cat.key] || {}
          const raw = cat.items.reduce((sum: number, item) => sum + (scores[item.id] ?? 0), 0)
          categoryScores[cat.key] = { raw, max: cat.items.length * 4 }
        }
        const teacherTotal = calculateTotal(categoryScores)
        // Auto-combine: average of principal and teacher scores
        const combined = assmt.principal_total != null ? Math.round(((assmt.principal_total + teacherTotal) / 2) * 10) / 10 : teacherTotal

        const now = new Date()
        const day = String(now.getDate()).padStart(2, "0")
        const month = String(now.getMonth() + 1).padStart(2, "0")
        const year = now.getFullYear()
        const hours = String(now.getHours()).padStart(2, "0")
        const minutes = String(now.getMinutes()).padStart(2, "0")
        const seconds = String(now.getSeconds()).padStart(2, "0")
        const dateStr = `Day: ${day}-${month}-${year} Time: ${hours}--${minutes}--${seconds}`
        const teacherSig = body.signature_data_url
          ? `${body.signature_data_url}`
          : `Signed by ${profile.full_name} — ${dateStr}`
        const { data, error } = await (ADMIN().from("teacher_performance_assessments") as any)
          .update({
            teacher_scores: body.teacher_scores,
            teacher_total: teacherTotal,
            teacher_submitted_at: new Date().toISOString(),
            combined_total: combined,
            combined_grade: getGradeLabel(combined),
            status: "completed",
            teacher_signature: teacherSig,
            teacher_signed_at: new Date().toISOString(),
            post_conference_held: true,
          }).eq("id", id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json(data)
      }
      return NextResponse.json({ error: "teacher_scores required" }, { status: 400 })
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "principal"])
    if (authError) return authError
    const { id } = await params
    if (profile.role !== "super_admin") {
      const { data: a } = await (ADMIN().from("teacher_performance_assessments") as any).select("principal_id, status").eq("id", id).single()
      if (!a || a.principal_id !== user.id || a.status !== "draft") return new NextResponse("Forbidden", { status: 403 })
    }
    const { error } = await (ADMIN().from("teacher_performance_assessments") as any).delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
