import { createClient } from "@supabase/supabase-js"

const FALLBACK_URL = "https://yvnomvcmqsfbkqqjwzhi.supabase.co"
const FALLBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjM0NzQsImV4cCI6MjA5ODMzOTQ3NH0.QBpmyNnEFxzMXoxEjQY16cOYNUUbK0I3oUU0GwjJBX0"
const FALLBACK_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc2MzQ3NCwiZXhwIjoyMDk4MzM5NDc0fQ.kURnxdJms7u6G1wkbApW7D8pAXCN96J2OSjQino5YFc"

interface SupabaseCredentials {
  url: string
  anonKey: string
  serviceKey: string
}

let cachedAdminCredentials: { url: string; serviceKey: string } | null = null
let lastFetch = 0
const CACHE_TTL = 60_000

export function getFallbackCredentials(): SupabaseCredentials {
  return {
    url: FALLBACK_URL,
    anonKey: FALLBACK_ANON_KEY,
    serviceKey: FALLBACK_SERVICE_KEY,
  }
}

export async function loadAdminServiceCredentials(): Promise<{ url: string; serviceKey: string }> {
  if (cachedAdminCredentials && Date.now() - lastFetch < CACHE_TTL) {
    return cachedAdminCredentials
  }
  const fallback = { url: FALLBACK_URL, serviceKey: FALLBACK_SERVICE_KEY }
  try {
    const bootstrap = createClient(FALLBACK_URL, FALLBACK_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await (bootstrap.from("school_settings") as any)
      .select("supabase_service_role_key")
      .eq("id", 1)
      .single()
    if (data?.supabase_service_role_key) {
      cachedAdminCredentials = { url: FALLBACK_URL, serviceKey: data.supabase_service_role_key }
    } else {
      cachedAdminCredentials = fallback
    }
  } catch {
    cachedAdminCredentials = fallback
  }
  lastFetch = Date.now()
  return cachedAdminCredentials
}

export async function clearCredentialsCache() {
  cachedAdminCredentials = null
  lastFetch = 0
}
