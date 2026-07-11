import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getFallbackCredentials } from "./supabase-config"

export async function updateSession(request: NextRequest) {
  const creds = getFallbackCredentials()
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    creds.url,
    creds.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    await supabase.auth.getUser()
  } catch {
    // Refresh token invalid — clear auth cookies
    const authCookies = ["sb-refresh-token", "sb-access-token", "supabase-auth-token"]
    for (const name of authCookies) {
      supabaseResponse.cookies.set(name, "", { maxAge: 0, path: "/" })
    }
  }
  return supabaseResponse
}