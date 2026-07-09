import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

type Role = "super_admin" | "teacher" | "lab_assistant" | "student" | "principal"

const ROLE_ROUTES: Record<string, Role[]> = {
  "/grades": ["super_admin", "teacher"],
  "/generate": ["super_admin", "teacher"],
  "/grading": ["super_admin", "teacher"],
  "/profile": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/help": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/lesson-plan": ["super_admin", "teacher"],
  "/memory": ["super_admin", "teacher"],
  "/analytics": ["super_admin", "teacher", "principal"],
  "/journals": ["super_admin", "teacher"],
  "/settings": ["super_admin", "teacher", "principal"],
  "/lab": ["super_admin", "lab_assistant"],
  "/syllabus": ["super_admin", "teacher"],
  "/syllabus-manager": ["super_admin", "teacher"],
  "/worksheets": ["super_admin", "teacher"],
  "/calendar": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/my-week": ["student"],
  "/my-work": ["student"],
  "/my-progress": ["student"],
  "/my-journal": ["student"],
  "/pre-class": ["student"],
  "/principal": ["principal"],
  "/supervisions": ["super_admin", "principal", "teacher"],
  "/tpa": ["super_admin", "principal", "teacher"],
}

const API_ROLE_ROUTES: Record<string, Role[]> = {
  "/api/admin/": ["super_admin"],
  "/api/settings/ai-providers": ["super_admin", "teacher", "principal"],
  "/api/settings/school": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/api/settings/rbac": ["super_admin"],
  "/api/users/": ["super_admin"],
  "/api/seed/": ["super_admin"],
  "/api/setup-db": ["super_admin"],
  "/api/principal/": ["super_admin", "principal"],
  "/api/webhooks/": [],
  "/api/agents/": ["super_admin", "teacher"],
  "/api/analytics": ["super_admin", "teacher", "principal"],
  "/api/calendar": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/api/entry-ticket": ["super_admin", "teacher", "student"],
  "/api/export/": ["super_admin", "teacher", "principal"],
  "/api/export/distribution-xlsx": ["super_admin"],
  "/api/export/master-template": ["super_admin"],
  "/api/classes": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/api/journals": ["super_admin", "teacher", "student", "principal"],
  "/api/lab": ["super_admin", "teacher", "lab_assistant", "student"],
  "/api/lesson-plan/": ["super_admin", "teacher"],
  "/api/memory/": ["super_admin", "teacher"],
  "/api/notifications": ["super_admin", "teacher", "student", "principal"],
  "/api/packages": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/api/settings/tpa-weights": ["super_admin", "principal"],
  "/api/profiles": ["super_admin", "teacher", "principal", "student"],
  "/api/student-work": ["super_admin", "teacher", "student", "principal"],
  "/api/student/": ["super_admin", "teacher", "student", "principal"],
  "/api/supervisions": ["super_admin", "principal", "teacher"],
  "/api/syllabus": ["super_admin", "teacher", "student", "principal"],
  "/api/teacher/": ["super_admin", "teacher"],
  "/api/teacher-assignments/template": ["super_admin"],
  "/api/teacher-assignments/upload": ["super_admin"],
  "/api/teacher-assignments": ["super_admin", "teacher", "principal"],
  "/api/upload": ["super_admin", "teacher"],
  "/api/subjects": ["super_admin", "teacher", "lab_assistant", "student", "principal"],
  "/api/tpa": ["super_admin", "principal", "teacher"],
  "/api/worksheets": ["super_admin", "teacher", "student"],
}

const PUBLIC_API_ROUTES = [
  "/api/favicon",
  "/api/published-items",
  "/api/syllabus/public/",
  "/api/worksheet/public/",
]

function getSupabase(request: NextRequest) {
  const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
  const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDk5OTIsImV4cCI6MjA2NDg4NTk5Mn0.vWLHVhrRqxS3uK32Pob8cBESQqJfZbyEze3Ky3JHTRw'
  const supabaseUrl = FALLBACK_URL
  const supabaseAnonKey = FALLBACK_ANON_KEY

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

async function getUserRole(user: { id: string; app_metadata: Record<string, unknown> }, supabase: any): Promise<Role | null> {
  // Fast path: role already in JWT app_metadata — zero DB queries
  const role = user.app_metadata?.role as Role | undefined
  if (role) return role
  // Fallback: query profiles table (existing users before app_metadata)
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: Role } | null }
  return data?.role ?? null
}

function matchProtectedRoute(pathname: string): string | null {
  // Public routes that should bypass auth
  if (pathname.startsWith("/syllabus/public/") || pathname.startsWith("/worksheet/public/")) return null
  for (const route of Object.keys(ROLE_ROUTES)) {
    if (pathname === route || pathname.startsWith(route + "/")) return route
  }
  return null
}

function matchApiRoute(pathname: string): string | null {
  for (const [prefix, _roles] of Object.entries(API_ROLE_ROUTES)) {
    if (pathname.startsWith(prefix)) return prefix
  }
  return null
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))
}

export async function proxy(request: NextRequest) {
  const ctx = getSupabase(request)
  if (!ctx) {
    return NextResponse.next({ request })
  }

  const { supabase, supabaseResponse } = ctx
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const authRoutes = ["/login", "/register", "/forgot-password", "/update-password"]
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
    const role = await getUserRole(user, supabase)
    if (!role) return supabaseResponse

    const matched = matchProtectedRoute(pathname)
    if (matched && !ROLE_ROUTES[matched].includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    const apiRouteMatched = matchApiRoute(pathname)
    if (apiRouteMatched && pathname.startsWith("/api/")) {
      const allowedRoles = API_ROLE_ROUTES[apiRouteMatched]
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
  }

  // Public API routes skip auth
  if (pathname.startsWith("/api/") && !isPublicApiRoute(pathname) && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
