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
  FileText,
  BookOpen,
  PenTool,
  BarChart3,
  ClipboardList,
} from "lucide-react"
import { ROUTES } from "@/lib/utils/constants"
import { useRBAC } from "@/hooks/use-rbac"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: ("super_admin" | "teacher" | "lab_assistant" | "student" | "principal")[]
}

const allMobileNavItems: NavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "teacher", "lab_assistant", "student", "principal"] },
  { href: ROUTES.GRADES, label: "Grades", icon: GraduationCap, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GENERATE, label: "Generate", icon: BrainCircuit, roles: ["super_admin", "teacher"] },
  { href: ROUTES.LESSON_PLAN, label: "Lsn Plan", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: "/worksheets", label: "WS", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: ROUTES.CALENDAR, label: "Calendar", icon: Calendar, roles: ["super_admin", "teacher", "lab_assistant", "student", "principal"] },
  { href: ROUTES.LAB, label: "Lab", icon: Beaker, roles: ["super_admin", "lab_assistant"] },
  { href: "/principal", label: "Principal", icon: BarChart3, roles: ["principal"] },
  { href: "/supervisions", label: "Superv", icon: FileText, roles: ["principal", "teacher"] },
  { href: "/my-week", label: "My Week", icon: BookOpen, roles: ["student"] },
  { href: "/my-work", label: "My Work", icon: PenTool, roles: ["student"] },
  { href: "/my-progress", label: "Progress", icon: BarChart3, roles: ["student"] },
  { href: "/my-journal", label: "Journal", icon: ClipboardList, roles: ["student"] },
  { href: "/pre-class", label: "Pre-Class", icon: GraduationCap, roles: ["student"] },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { role } = useRBAC()

  const mobileNavItems = role
    ? allMobileNavItems.filter((item) => item.roles.includes(role))
    : allMobileNavItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto border-t bg-background md:hidden scrollbar-hide">
      {mobileNavItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium min-w-0",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
