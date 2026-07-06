"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"

const ROLE_REDIRECTS: Record<string, Record<string, string>> = {
  student: {
    "/grades": "/dashboard",
    "/generate": "/dashboard",
    "/grading": "/dashboard",
    "/lesson-plan": "/dashboard",
    "/analytics": "/dashboard",
    "/settings": "/dashboard",
    "/lab": "/dashboard",
  },
  teacher: {
  },
  lab_assistant: {
    "/grades": "/dashboard",
    "/generate": "/dashboard",
    "/grading": "/dashboard",
    "/lesson-plan": "/dashboard",
    "/memory": "/dashboard",
    "/analytics": "/dashboard",
    "/settings": "/dashboard",
    "/syllabus": "/dashboard",
  },
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const { role } = useRBAC()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    if (role && ROLE_REDIRECTS[role]) {
      const redirect = ROLE_REDIRECTS[role][pathname]
      if (redirect) {
        router.push(redirect)
      }
    }
  }, [user, loading, role, pathname, router])

  // Close sidebar on route change (mobile/tablet)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      {/* Overlay for mobile/tablet */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="flex flex-1 flex-col pb-16 lg:pb-0 min-w-0">
        <Header onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  )
}
