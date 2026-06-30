import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type Role = "super_admin" | "teacher" | "lab_assistant" | "student"

const ROLE_ROUTES: Record<string, Role[]> = {
  "/grades": ["super_admin", "teacher"],
  "/generate": ["super_admin", "teacher"],
  "/help": ["super_admin", "teacher", "lab_assistant", "student"],
  "/lesson-plan": ["super_admin", "teacher"],
  "/memory": ["super_admin", "teacher"],
  "/analytics": ["super_admin", "teacher"],
  "/journals": ["super_admin", "teacher"],
  "/settings": ["super_admin"],
  "/lab": ["super_admin", "teacher", "lab_assistant", "student"],
  "/syllabus": ["super_admin", "teacher"],
  "/calendar": ["super_admin", "teacher", "lab_assistant"],
  "/my-week": ["student"],
  "/my-journal": ["student"],
  "/pre-class": ["student"],
}

function getSupabase(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })
  return { supabase, supabaseResponse }
}

function matchProtectedRoute(pathname: string): string | null {
  for (const route of Object.keys(ROLE_ROUTES)) {
    if (pathname === route || pathname.startsWith(route + "/")) return route
  }
  return null
}

export async function proxy(request: NextRequest) {
  const ctx = getSupabase(request)
  if (!ctx) {
    return NextResponse.next({ request })
  }

  const { supabase, supabaseResponse } = ctx
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const authRoutes = ["/login", "/register", "/forgot-password"]
  const isAuthPage = authRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = pathname.startsWith("/dashboard") || matchProtectedRoute(pathname)

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  if (user) {
    const matched = matchProtectedRoute(pathname)
    if (matched) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single() as { data: { role: Role } | null }

      if (profile && !ROLE_ROUTES[matched].includes(profile.role)) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
