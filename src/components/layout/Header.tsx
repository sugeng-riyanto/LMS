"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { LogOut, User, Shield, FlaskConical, Menu } from "lucide-react"
import { useRBAC } from "@/hooks/use-rbac"
import { ROLE_LABELS } from "@/lib/utils/constants"
import { useSchoolSettings } from "@/hooks/use-school-settings"
import { NotificationBell } from "@/components/notifications/NotificationBell"

interface HeaderProps {
  onMenuToggle?: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { profile, signOut } = useAuth()
  const { role, isStudent } = useRBAC()
  const { data: school } = useSchoolSettings()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2 lg:hidden">
        {school?.logo_url ? (
          <img src={school.logo_url} alt={school.school_name} className="h-6 w-6 rounded object-contain" />
        ) : (
          <FlaskConical className="h-5 w-5 text-primary" />
        )}
        <span className="text-sm font-semibold truncate max-w-[120px]">{school?.school_name ?? "Physics CC"}</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        {isStudent && <NotificationBell />}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{profile?.full_name ?? "User"}</span>
          {role && (
            <span className="hidden rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {ROLE_LABELS[role]}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
