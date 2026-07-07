import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data } = await (supabase.from("principal_assignments") as any)
      .select("level")
      .eq("principal_id", user.id)
      .maybeSingle()

    return NextResponse.json({ level: data?.level ?? null })
  } catch {
    return NextResponse.json({ level: null })
  }
}
