import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const { supabase_url, supabase_anon_key } = await request.json()
    if (!supabase_url || !supabase_anon_key) {
      return NextResponse.json({ error: "URL and anon key required" }, { status: 400 })
    }
    const client = createClient(supabase_url, supabase_anon_key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await client.auth.getSession()
    if (error) {
      return NextResponse.json({ error: `Supabase error: ${error.message}` }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection test failed" },
      { status: 500 }
    )
  }
}
