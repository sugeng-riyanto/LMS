import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { supabase_url, supabase_anon_key } = await request.json()
    if (!supabase_url || !supabase_anon_key) {
      return NextResponse.json({ error: "URL and anon key required" }, { status: 400 })
    }
    const r = await fetch(`${supabase_url.replace(/\/+$/, "")}/rest/v1/`, {
      headers: { "apikey": supabase_anon_key, "Authorization": `Bearer ${supabase_anon_key}` },
    })
    if (r.ok || r.status === 404) {
      return NextResponse.json({ ok: true })
    }
    const body = await r.text().catch(() => "unknown")
    return NextResponse.json({ error: `HTTP ${r.status}: ${body}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection test failed" },
      { status: 500 }
    )
  }
}
