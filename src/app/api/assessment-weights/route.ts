import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

const CATEGORIES = ["classwork", "unit_test", "project", "homework", "mid_semester", "final_semester"]

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "principal"])
    if (authError) return authError
    const { searchParams } = new URL(request.url)
    const grade = searchParams.get("grade")

    let query = (supabase.from("assessment_weights") as any).select("*").order("grade").order("category")
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
    const { user, supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const body = await request.json()
    const { grade, weights } = body

    if (!grade || grade < 7 || grade > 12) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 })
    }
    if (!weights || typeof weights !== "object") {
      return NextResponse.json({ error: "weights object required" }, { status: 400 })
    }

    const total = Object.values(weights).reduce((s: number, w: any) => s + parseFloat(w), 0)
    if (Math.abs(total - 1) > 0.01) {
      return NextResponse.json({ error: `Weights must sum to 1.0 (current: ${total.toFixed(3)})` }, { status: 400 })
    }

    const results = []
    for (const cat of CATEGORIES) {
      if (weights[cat] === undefined) continue
      const w = parseFloat(weights[cat])
      const { data, error } = await (supabase.from("assessment_weights") as any).upsert({
        grade, category: cat, weight: w, updated_by: user.id,
      }, { onConflict: "grade,category" }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      results.push(data)
    }

    return NextResponse.json({ message: `Saved ${results.length} weights for Grade ${grade}`, results })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
