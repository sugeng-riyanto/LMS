import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { supabase_url, supabase_anon_key } = await request.json()
    if (!supabase_url || !supabase_anon_key) {
      return NextResponse.json({ error: "URL and anon key required" }, { status: 400 })
    }
    const base = supabase_url.replace(/\/+$/, "")

    const health = await fetch(`${base}/auth/v1/health`, {
      headers: { "apikey": supabase_anon_key },
    })
    if (!health.ok) {
      const body = await health.text().catch(() => "")
      return NextResponse.json({ error: `Supabase return HTTP ${health.status}: ${body}` }, { status: 400 })
    }

    const test = await fetch(`${base}/rest/v1/profiles?select=count`, {
      headers: { "apikey": supabase_anon_key, "Authorization": `Bearer ${supabase_anon_key}` },
    })
    if (test.ok) {
      return NextResponse.json({ ok: true })
    }
    const body = await test.text().catch(() => "")
    if (test.status === 401 && body.includes("service_role")) {
      return NextResponse.json({ ok: true, note: "URL ok, but key is publishable-only (not suitable for server)" })
    }
    return NextResponse.json({ error: `HTTP ${test.status}: ${test.ok ? "unexpected" : body}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Connection test failed" },
      { status: 500 }
    )
  }
}
