import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const isOwn = user.id === id

    if (!isOwn) {
      const result = await requireRole(["super_admin", "teacher", "principal"])
      if (result.error) return result.error
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, grade_assigned, avatar_url, is_active, last_login_at, created_at")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "PGRST116") return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase, user, profile, error: authError } = await requireRole(["super_admin", "teacher", "student"])
    if (authError) return authError

    const role = profile?.role ?? user?.app_metadata?.role as string | undefined
    const { id } = await params
    const body = await request.json()
    const isOwn = user.id === id

    if (role !== "super_admin" && !isOwn) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const allowedFields = role === "super_admin"
      ? ["full_name", "email", "role", "grade_assigned", "class_id", "avatar_url", "phone_number", "is_active"]
      : ["full_name", "avatar_url", "phone_number"]

    const updates: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field]
    }
    updates.updated_at = new Date().toISOString()

    // Sync email with Supabase Auth if super_admin changed it
    if (role === "super_admin" && body.email !== undefined) {
      const admin = createAdminClient()
      const { error: authError } = await admin.auth.admin.updateUserById(id, { email: body.email })
      if (authError) return NextResponse.json({ error: `Auth update failed: ${authError.message}` }, { status: 500 })
    }

    const { data, error } = await (supabase
      .from("profiles") as any)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { id } = await params
    const admin = createAdminClient()

    // Delete auth user first
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(id)
    if (authDeleteError) {
      // If auth user not found, still try to delete profile
      console.warn("Auth delete warning:", authDeleteError.message)
    }

    // Delete profile
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", id)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    return NextResponse.json({ message: "User deleted" })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
