"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import {
  LayoutDashboard,
  FlaskConical,
  Calendar,
  Beaker,
  BookOpen,
  Settings,
  BrainCircuit,
  FileText,
  GraduationCap,
  ClipboardList,
  HelpCircle,
  CheckCircle,
  PenTool,
  BarChart3,
  User,
} from "lucide-react"
import { ROUTES } from "@/lib/utils/constants"
import { useRBAC } from "@/hooks/use-rbac"
import { useSchoolSettings } from "@/hooks/use-school-settings"

interface NavItem {
  href: string
  label: string
  icon: typeof LayoutDashboard
  roles: ("super_admin" | "teacher" | "lab_assistant" | "student")[]
}

const allNavItems: NavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.GRADES, label: "Grades", icon: GraduationCap, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GENERATE, label: "Generate", icon: BrainCircuit, roles: ["super_admin", "teacher"] },
  { href: ROUTES.GRADING, label: "Grading", icon: CheckCircle, roles: ["super_admin", "teacher"] },
  { href: ROUTES.LESSON_PLAN, label: "Lesson Plan", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: ROUTES.SYLLABUS, label: "Syllabus", icon: ClipboardList, roles: ["super_admin", "teacher"] },
  { href: "/syllabus-manager", label: "Syllabus Files", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: ROUTES.CALENDAR, label: "Calendar", icon: Calendar, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.LAB, label: "Lab", icon: Beaker, roles: ["super_admin", "lab_assistant"] },
  { href: ROUTES.MEMORY, label: "Memory", icon: BookOpen, roles: ["super_admin", "teacher"] },
  { href: ROUTES.ANALYTICS, label: "Analytics", icon: FileText, roles: ["super_admin", "teacher"] },
  { href: "/profile", label: "Profile", icon: User, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings, roles: ["super_admin"] },
  { href: "/my-week", label: "My Week", icon: BookOpen, roles: ["student"] },
  { href: "/my-work", label: "My Work", icon: PenTool, roles: ["student"] },
  { href: "/my-progress", label: "My Progress", icon: BarChart3, roles: ["student"] },
  { href: "/my-journal", label: "My Journal", icon: ClipboardList, roles: ["student"] },
  { href: "/pre-class", label: "Pre-Class", icon: GraduationCap, roles: ["student"] },
  { href: ROUTES.HELP, label: "Help", icon: HelpCircle, roles: ["super_admin", "teacher", "lab_assistant", "student"] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { role } = useRBAC()
  const { data: school } = useSchoolSettings()

  const navItems = role
    ? allNavItems.filter((item) => item.roles.includes(role))
    : allNavItems

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar lg:flex">
      <div className="flex items-center gap-2 border-b px-6 py-4">
        {school?.logo_url ? (
          <img src={school.logo_url} alt={school.school_name} className="h-8 w-8 rounded object-contain" />
        ) : (
          <FlaskConical className="h-6 w-6 text-primary" />
        )}
        <span className="text-sm font-semibold truncate">{school?.school_name ?? "Physics CC"}</span>
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
