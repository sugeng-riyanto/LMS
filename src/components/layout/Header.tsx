"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { LogOut, User, Shield, FlaskConical, Sun, Moon } from "lucide-react"
import { useRBAC } from "@/hooks/use-rbac"
import { useTheme } from "next-themes"
import { ROLE_LABELS } from "@/lib/utils/constants"
import { useSchoolSettings } from "@/hooks/use-school-settings"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import FontSizeToggle from "@/components/layout/FontSizeToggle"

export default function Header() {
  const { profile, signOut } = useAuth()
  const { role, isStudent } = useRBAC()
  const { data: school } = useSchoolSettings()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-6">
      <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden min-w-0">
        {school?.logo_url ? (
          <img src={school.logo_url} alt={school.school_name} className="h-5 w-5 sm:h-6 sm:w-6 rounded object-contain shrink-0" />
        ) : (
          <FlaskConical className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-semibold truncate max-w-[80px] sm:max-w-[120px]">{school?.school_name ?? "SHB"}</span>
      </div>
      <div className="flex-1 min-w-0" />
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-accent transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
        </button>
        <div className="hidden sm:block"><FontSizeToggle /></div>
        {isStudent && <NotificationBell />}
        <div className="hidden sm:flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground hidden md:inline">{profile?.full_name ?? "User"}</span>
          {role && (
            <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg p-1.5 sm:p-2 text-muted-foreground hover:bg-accent"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </header>
  )
}
