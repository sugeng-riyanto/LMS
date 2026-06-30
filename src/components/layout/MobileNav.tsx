"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  GraduationCap,
  BrainCircuit,
  Calendar,
  Beaker,
} from "lucide-react"
import { ROUTES } from "@/lib/utils/constants"
import { useRBAC } from "@/hooks/use-rbac"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: ("super_admin" | "teacher" | "lab_assistant" | "student")[]
}

const allMobileNavItems: NavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.GRADES, label: "Grades", icon: GraduationCap, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GENERATE, label: "Generate", icon: BrainCircuit, roles: ["super_admin", "teacher"] },
  { href: ROUTES.CALENDAR, label: "Calendar", icon: Calendar, roles: ["super_admin", "teacher", "lab_assistant"] },
  { href: ROUTES.LAB, label: "Lab", icon: Beaker, roles: ["super_admin", "lab_assistant"] },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { role } = useRBAC()

  const mobileNavItems = role
    ? allMobileNavItems.filter((item) => item.roles.includes(role))
    : allMobileNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background lg:hidden">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
