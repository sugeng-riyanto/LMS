import { createClient } from "@supabase/supabase-js"

const FALLBACK_URL = "https://yvnomvcmqsfbkqqjwzhi.supabase.co"
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDk5OTIsImV4cCI6MjA2NDg4NTk5Mn0.vWLHVhrRqxS3uK32Pob8cBESQqJfZbyEze3Ky3JHTRw"
const FALLBACK_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc2MzQ3NCwiZXhwIjoyMDk4MzM5NDc0fQ.kURnxdJms7u6G1wkbApW7D8pAXCN96J2OSjQino5YFc"

interface SupabaseCredentials {
  url: string
  anonKey: string
  serviceKey: string
}

let cachedCredentials: SupabaseCredentials | null = null
let lastFetch = 0
const CACHE_TTL = 60_000

export function getFallbackCredentials(): SupabaseCredentials {
  return {
    url: FALLBACK_URL,
    anonKey: FALLBACK_ANON_KEY,
    serviceKey: FALLBACK_SERVICE_KEY,
  }
}

export async function loadServerCredentials(): Promise<SupabaseCredentials> {
  if (cachedCredentials && Date.now() - lastFetch < CACHE_TTL) {
    return cachedCredentials
  }
  const fallback = getFallbackCredentials()
  try {
    const bootstrap = createClient(fallback.url, fallback.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await (bootstrap.from("school_settings") as any)
      .select("supabase_url, supabase_anon_key, supabase_service_role_key")
      .eq("id", 1)
      .single()
    if (data?.supabase_url && data?.supabase_anon_key) {
      cachedCredentials = {
        url: data.supabase_url,
        anonKey: data.supabase_anon_key,
        serviceKey: data.supabase_service_role_key || fallback.serviceKey,
      }
    } else {
      cachedCredentials = fallback
    }
  } catch {
    cachedCredentials = fallback
  }
  lastFetch = Date.now()
  return cachedCredentials
}

export async function clearCredentialsCache() {
  cachedCredentials = null
  lastFetch = 0
}

export function getCredentialsSnapshot(): SupabaseCredentials | null {
  return cachedCredentials
}
