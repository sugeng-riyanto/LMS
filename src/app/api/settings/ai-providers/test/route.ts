import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: "Provider id is required" }, { status: 400 })
    }

    const { data: provider, error: fetchError } = await (supabase.from("ai_providers") as any)
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    let testResult: { success: boolean; error?: string }

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      let body: Record<string, unknown>
      let url: string

      switch (provider.provider_type) {
        case "openai":
        case "groq":
        case "opencodeai": {
          url = `${provider.base_url || ""}/chat/completions`
          headers["Authorization"] = `Bearer ${provider.api_key}`
          body = {
            model: provider.default_model,
            messages: [{ role: "user", content: "Say 'connected' and nothing else." }],
            max_tokens: 10,
          }
          break
        }
        case "gemini": {
          url = `${provider.base_url || ""}/models/${provider.default_model}:generateContent`
          body = {
            contents: [{ parts: [{ text: "Say 'connected' and nothing else." }] }],
          }
          break
        }
        default:
          throw new Error(`Unknown provider type: ${provider.provider_type}`)
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => "Unknown error")
        testResult = { success: false, error: `HTTP ${response.status}: ${errText.slice(0, 200)}` }
      } else {
        testResult = { success: true }
      }
    } catch (err) {
      testResult = { success: false, error: err instanceof Error ? err.message : "Request failed" }
    }

    await (supabase.from("ai_providers") as any)
      .update({
        test_status: testResult.success ? "working" : "failed",
        last_tested_at: new Date().toISOString(),
      })
      .eq("id", id)

    return NextResponse.json(testResult)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
