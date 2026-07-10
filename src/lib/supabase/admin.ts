import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { getFallbackCredentials } from "./supabase-config"

export function createAdminClient() {
  const creds = getFallbackCredentials()
  return createClient<Database>(
    creds.url,
    creds.serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
