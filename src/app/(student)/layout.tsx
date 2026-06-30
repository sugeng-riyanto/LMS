"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import { BookOpen, ClipboardList, GraduationCap, LogOut, Settings, PenTool, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/my-week", label: "My Week", icon: BookOpen },
  { href: "/my-work", label: "My Work", icon: PenTool },
  { href: "/my-progress", label: "My Progress", icon: BarChart3 },
  { href: "/my-journal", label: "My Journal", icon: ClipboardList },
  { href: "/pre-class", label: "Pre-Class", icon: GraduationCap },
]

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }
    if (!loading && user && profile && profile.role !== "student") {
      router.push("/dashboard")
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user || profile?.role !== "student") return null

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/my-week" className="flex items-center gap-2 font-semibold">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm">Physics</span>
            </Link>
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                const active = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/profile" className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent">
              <Settings className="h-3.5 w-3.5" />
              {profile?.full_name ?? "Student"}
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
