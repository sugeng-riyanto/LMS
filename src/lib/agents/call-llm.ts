import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { AIProvider } from "@/types/ai-provider"

export interface LLMResponse {
  content: string
  provider: string
  model: string
  latency_ms: number
}

export async function callLLM(
  prompt: string,
  options?: {
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    providerType?: string
  }
): Promise<LLMResponse> {
  const supabase = await createServerSupabaseClient()

  let query = (supabase.from("ai_providers") as any)
    .select("*")
    .eq("is_active", true)
    .order("priority")

  if (options?.providerType) {
    query = query.eq("provider_type", options.providerType)
  }

  const { data: providers, error } = await query.limit(1)

  if (error || !providers || providers.length === 0) {
    throw new Error("No active AI provider configured. Go to Settings > AI Providers to add one.")
  }

  const provider = providers[0] as AIProvider
  const startTime = Date.now()

  const {
    base_url = "",
    default_model,
    api_key,
    provider_type,
    config,
  } = provider

  const temperature = options?.temperature ?? config?.temperature ?? 0.7
  const maxTokens = options?.maxTokens ?? config?.max_tokens ?? 4096

  try {
    let content: string

    switch (provider_type) {
      case "openai":
      case "groq":
      case "opencodeai": {
        const messages: { role: string; content: string }[] = []
        if (options?.systemPrompt) {
          messages.push({ role: "system", content: options.systemPrompt })
        }
        messages.push({ role: "user", content: prompt })

        const res = await fetch(`${base_url}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${api_key}`,
          },
          body: JSON.stringify({
            model: default_model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        })

        if (!res.ok) {
          const err = await res.text().catch(() => "Unknown error")
          throw new Error(`${provider_type} API error (${res.status}): ${err.slice(0, 300)}`)
        }

        const data = await res.json()
        content = data.choices?.[0]?.message?.content ?? ""
        break
      }

      case "gemini": {
        const res = await fetch(
          `${base_url}/models/${default_model}:generateContent`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                ...(options?.systemPrompt
                  ? [{ role: "user", parts: [{ text: options.systemPrompt }] }]
                  : []),
                { role: "user", parts: [{ text: prompt }] },
              ],
              generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
              },
            }),
          }
        )

        if (!res.ok) {
          const err = await res.text().catch(() => "Unknown error")
          throw new Error(`Gemini API error (${res.status}): ${err.slice(0, 300)}`)
        }

        const data = await res.json()
        content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
        break
      }

      default:
        throw new Error(`Unsupported provider type: ${provider_type}`)
    }

    return {
      content,
      provider: provider.display_name,
      model: default_model,
      latency_ms: Date.now() - startTime,
    }
  } catch (err) {
    throw new Error(
      `LLM call failed via ${provider.display_name} (${default_model}): ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    )
  }
}

export async function getActiveProvider(): Promise<AIProvider | null> {
  const supabase = await createServerSupabaseClient()
  const { data } = await (supabase.from("ai_providers") as any)
    .select("*")
    .eq("is_active", true)
    .order("priority")
    .limit(1)

  return data?.[0] ?? null
}
