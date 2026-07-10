import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"
import { getFallbackCredentials } from "./supabase-config"

export async function createServerSupabaseClient() {
  const creds = getFallbackCredentials()
  const cookieStore = await cookies()
  return createServerClient<Database>(
    creds.url,
    creds.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
