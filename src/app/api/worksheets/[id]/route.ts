import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await (supabase.from("shared_worksheets") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (error || !data) {
      return new NextResponse("Worksheet not found", { status: 404 })
    }

    return NextResponse.json(data)
  } catch {
    return new NextResponse("Worksheet not found", { status: 404 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { requireRole } = await import("@/lib/supabase/require-role")
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const allowed = ["title", "grade", "week_number", "topic", "pdf_url", "pdf_pages", "media_links"]

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field]
    }

    const { data, error } = await (supabase.from("shared_worksheets") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const { requireRole } = await import("@/lib/supabase/require-role")
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const { error } = await (supabase.from("shared_worksheets") as any)
      .delete()
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
