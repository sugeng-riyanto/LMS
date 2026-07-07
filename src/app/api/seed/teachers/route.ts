import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"

const DEMO_TEACHERS = [
  { email: "rina.wijaya@shb.sch.id", full_name: "Rina Wijaya, S.Pd.", grade: 7, subject: "MAT" },
  { email: "bambang.supriyadi@shb.sch.id", full_name: "Bambang Supriyadi, S.Pd.", grade: 8, subject: "PHY" },
  { email: "siti.nurhaliza@shb.sch.id", full_name: "Siti Nurhaliza, S.Si.", grade: 9, subject: "CHE" },
  { email: "dwi.cahyo@shb.sch.id", full_name: "Dwi Cahyo, S.Pd.", grade: 7, subject: "BIO" },
  { email: "dewi.sartika@shb.sch.id", full_name: "Dewi Sartika, S.Pd.", grade: 8, subject: "MAT" },
  { email: "agus.wibowo@shb.sch.id", full_name: "Agus Wibowo, S.Pd.", grade: 10, subject: "PHY" },
  { email: "tri.handayani@shb.sch.id", full_name: "Tri Handayani, S.Si.", grade: 10, subject: "CHE" },
  { email: "eko.prasetyo@shb.sch.id", full_name: "Eko Prasetyo, S.Pd.", grade: 11, subject: "BIO" },
  { email: "fitri.ananda@shb.sch.id", full_name: "Fitri Ananda, S.Pd.", grade: 11, subject: "MAT" },
  { email: "maya.anggraini@shb.sch.id", full_name: "Maya Anggraini, S.Pd.", grade: 12, subject: "ECO" },
]

export async function POST() {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const admin = createAdminClient()
    const results: { email: string; status: string; temp_password?: string; error?: string }[] = []

    for (const t of DEMO_TEACHERS) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await admin.auth.admin.listUsers()
        const existing = existingUsers?.users.find(u => u.email === t.email)

        if (existing) {
          // User exists but may not have profile — ensure it exists
          const { data: existingProfile } = await (admin.from("profiles") as any)
            .select("id")
            .eq("id", existing.id)
            .single()

          if (!existingProfile) {
            await (admin.from("profiles") as any).insert({
              id: existing.id,
              email: t.email,
              full_name: t.full_name,
              role: "teacher",
              grade_assigned: t.grade,
            })
          }

          results.push({ email: t.email, status: "already_exists" })
          continue
        }

        // Create new auth user
        const tempPassword = "teacher123"
        const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
          email: t.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { full_name: t.full_name, role: "teacher" },
          app_metadata: { role: "teacher", full_name: t.full_name },
        })

        if (createErr || !authUser?.user) {
          results.push({ email: t.email, status: "error", error: createErr?.message })
          continue
        }

        // Create profile
        await (admin.from("profiles") as any).insert({
          id: authUser.user.id,
          email: t.email,
          full_name: t.full_name,
          role: "teacher",
          grade_assigned: t.grade,
        })

        results.push({ email: t.email, status: "created", temp_password: tempPassword })
      } catch (e) {
        results.push({ email: t.email, status: "error", error: String(e) })
      }
    }

    // Create teacher assignments
    for (const t of DEMO_TEACHERS) {
      try {
        const { data: existingUser } = await (admin.from("profiles") as any)
          .select("id")
          .eq("email", t.email)
          .single()

        if (existingUser) {
          const className = String.fromCharCode(64 + ((t.grade - 1) % 3 + 1))
          const { data: classRow } = await (admin.from("classes") as any)
            .select("id")
            .eq("grade", t.grade)
            .eq("class_name", className)
            .maybeSingle()

          const assignmentExists = await (admin.from("teacher_assignments") as any)
            .select("id")
            .eq("teacher_id", existingUser.id)
            .eq("grade", t.grade)
            .maybeSingle()

          if (!assignmentExists?.id) {
            await (admin.from("teacher_assignments") as any).insert({
              teacher_id: existingUser.id,
              grade: t.grade,
              subject: t.subject,
              class_id: classRow?.id ?? null,
            })
          }
        }
      } catch { /* skip assignments if tables missing */ }
    }

    return NextResponse.json({ message: "Seeding complete", results })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
