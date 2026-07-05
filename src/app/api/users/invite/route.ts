import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const VALID_ROLES = ["super_admin", "teacher", "lab_assistant", "student"]
const VALID_GRADES = [7, 8, 9, 10, 11, 12]

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const body = await request.json()
    const { email, full_name, role, grade } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: "email and full_name are required" }, { status: 400 })
    }

    const userRole = VALID_ROLES.includes(role) ? role : "student"
    const gradeAssigned = VALID_GRADES.includes(Number(grade)) ? Number(grade) : null

    const tempPassword = "SHB-" + Math.random().toString(36).slice(2, 8)

    const admin = createAdminClient()
    const { data: authUser, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name, role: userRole },
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    if (!authUser?.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json({
      id: authUser.user.id,
      email,
      full_name,
      role: userRole,
      grade_assigned: gradeAssigned,
      temp_password: tempPassword,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
