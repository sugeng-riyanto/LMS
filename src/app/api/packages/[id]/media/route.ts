import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section")
    const mediaType = searchParams.get("type")

    let query = (supabase.from("media_attachments") as any)
      .select("*")
      .eq("package_id", id)
      .order("sort_order")

    if (section) query = query.eq("section", section)
    if (mediaType) query = query.eq("media_type", mediaType)

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await params
    const body = await request.json()

    if (!body.section || !body.media_type || !body.title) {
      return NextResponse.json({ error: "section, media_type, and title are required" }, { status: 400 })
    }

    const { data, error } = await (supabase.from("media_attachments") as any)
      .insert({
        package_id: id,
        section: body.section,
        media_type: body.media_type,
        title: body.title,
        url: body.url ?? null,
        embed_code: body.embed_code ?? null,
        sort_order: body.sort_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
