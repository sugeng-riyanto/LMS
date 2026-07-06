"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Beaker,
  BookOpen,
  Settings,
  BrainCircuit,
  FileText,
  ClipboardList,
  HelpCircle,
  CheckCircle,
  PenTool,
  BarChart3,
  User,
  X,
} from "lucide-react"
import { ROUTES, APP_NAME } from "@/lib/utils/constants"
import { useRBAC } from "@/hooks/use-rbac"
import { useSchoolSettings } from "@/hooks/use-school-settings"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: ("super_admin" | "teacher" | "lab_assistant" | "student")[]
}

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const allNavItems: NavItem[] = [
  // ── Teacher & Admin flow (plan → create → assess → review) ──
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.SYLLABUS, label: "Syllabus", icon: ClipboardList, roles: ["super_admin", "teacher"] },
  { href: ROUTES.LESSON_PLAN, label: "Lesson Plan", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: "/worksheets", label: "Worksheets", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GENERATE, label: "Generate", icon: BrainCircuit, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GRADING, label: "Grading", icon: CheckCircle, roles: ["super_admin", "teacher"] },
  { href: ROUTES.ANALYTICS, label: "Analytics", icon: BarChart3, roles: ["super_admin", "teacher"] },
  { href: "/syllabus-manager", label: "Syllabus Files", icon: ClipboardList, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GRADES, label: "Grades", icon: GraduationCap, roles: ["super_admin", "teacher"] },
  { href: ROUTES.CALENDAR, label: "Calendar", icon: Calendar, roles: ["super_admin", "teacher", "lab_assistant"] },
  { href: ROUTES.MEMORY, label: "Memory", icon: BookOpen, roles: ["super_admin", "teacher"] },
  { href: ROUTES.LAB, label: "Lab", icon: Beaker, roles: ["super_admin", "lab_assistant"] },

  // ── Student flow (view → do → review) ──
  { href: "/my-week", label: "My Week", icon: BookOpen, roles: ["student"] },
  { href: "/my-work", label: "My Work", icon: PenTool, roles: ["student"] },
  { href: "/pre-class", label: "Pre-Class", icon: GraduationCap, roles: ["student"] },
  { href: "/my-progress", label: "My Progress", icon: BarChart3, roles: ["student"] },
  { href: "/my-journal", label: "My Journal", icon: ClipboardList, roles: ["student"] },
  { href: ROUTES.CALENDAR, label: "Calendar", icon: Calendar, roles: ["student"] },

  // ── Account & Help ──
  { href: "/profile", label: "Profile", icon: User, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings, roles: ["super_admin", "teacher"] },
  { href: ROUTES.HELP, label: "Help", icon: HelpCircle, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
]

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { role } = useRBAC()
  const { data: school } = useSchoolSettings()

  const navItems = role
    ? allNavItems.filter((item) => item.roles.includes(role))
    : allNavItems

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={school.school_name} className="h-8 w-8 rounded object-contain" />
          ) : (
            <GraduationCap className="h-6 w-6 text-primary" />
          )}
          <span className="text-sm font-semibold truncate">{school?.school_name ?? APP_NAME}</span>
        </div>
        <button onClick={onMobileClose} className="rounded-lg p-1 text-muted-foreground hover:bg-accent lg:hidden">
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
