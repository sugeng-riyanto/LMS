"use client"

import { useState, useEffect } from "react"
import { usePackages } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  FlaskConical,
  Plus,
  Calendar,
  BookOpen,
  PenSquare,
  GraduationCap,
  ExternalLink,
  Download,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Badge } from "@/components/ui/badge"
import SubjectTabs from "@/components/ui/subject-tabs"
import { GRADES, GRADE_LABELS, ROUTES, PACKAGE_STATUS_LABELS, SUBJECTS } from "@/lib/utils/constants"
import type { WeeklyPackage } from "@/types/package"

function StatCard({
  label,
  value,
  icon: Icon,
  variant,
}: {
  label: string
  value: number
  icon: React.ElementType
  variant?: "default" | "success" | "warning" | "destructive"
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon
          className={cn(
            "h-5 w-5",
            variant === "success" && "text-green-500",
            variant === "warning" && "text-amber-500",
            variant === "destructive" && "text-red-500",
            (!variant || variant === "default") && "text-primary",
          )}
        />
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: WeeklyPackage["status"] }) {
  const variants: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {PACKAGE_STATUS_LABELS[status as keyof typeof PACKAGE_STATUS_LABELS] ?? status}
    </span>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { data: packages, isLoading } = usePackages()
  const { role, canManagePackages, isStudent, isSuperAdmin, isTeacher } = useRBAC()

  const [published, setPublished] = useState<{ worksheets: any[]; syllabi: any[]; syllabus_plans: any[]; submissions: Record<string, any> }>({ worksheets: [], syllabi: [], syllabus_plans: [], submissions: {} })
  const [subjectFilter, setSubjectFilter] = useState("all")

  useEffect(() => {
    if (isStudent && profile?.grade_assigned) {
      const subjectParam = subjectFilter !== "all" ? `&subject=${subjectFilter}` : ""
      fetch(`/api/published-items?grade=${profile.grade_assigned}${subjectParam}`)
        .then(r => r.json()).then(d => {
          setPublished(d)
          // Fetch submission status for each worksheet
          const wsIds = (d.worksheets || []).map((ws: any) => ws.id)
          const syIds = (d.syllabi || []).map((sy: any) => sy.id)
          const spIds = (d.syllabus_plans || []).map((sp: any) => sp.id)
          Promise.all([
            ...wsIds.map((id: string) =>
              fetch(`/api/student-work?worksheet_id=${id}`).then(r => r.json()).then(d => ({ id, data: d })).catch(() => null)
            ),
            ...syIds.map((id: string) =>
              fetch(`/api/student-work?syllabus_id=${id}`).then(r => r.json()).then(d => ({ id, data: d })).catch(() => null)
            ),
            ...spIds.map((id: string) =>
              fetch(`/api/student-work?syllabus_id=${id}`).then(r => r.json()).then(d => ({ id, data: d })).catch(() => null)
            )
          ]).then(results => {
            const subs: Record<string, any> = {}
            results.filter(Boolean).forEach((r: any) => {
              if (Array.isArray(r.data) && r.data.length > 0) {
                const statuses = r.data.map((w: any) => w.status)
                subs[r.id] = {
                  count: r.data.length,
                  allReturned: statuses.every((s: string) => s === 'returned'),
                  allGraded: statuses.every((s: string) => s === 'graded' || s === 'returned'),
                  status: statuses.includes('returned') ? 'returned' : statuses.includes('graded') ? 'graded' : 'submitted',
                }
              }
            })
            setPublished(p => ({ ...p, submissions: subs }))
          }).catch(() => {})
        }).catch(() => {})
    }
  }, [isStudent, profile?.grade_assigned, subjectFilter])

  if (isStudent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {profile?.full_name?.split(" ")[0] ?? "Student"}
          </h1>
          <p className="text-muted-foreground">Your personalised overview. Access weekly packages, published worksheets, syllabus assignments, and quick links to My Week, Mistake Journal, and Pre-Class preparation.</p>
        </div>

        <SubjectTabs value={subjectFilter} onChange={setSubjectFilter} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/my-week"
            className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
          >
            <GraduationCap className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-semibold">My Week</p>
              <p className="text-xs text-muted-foreground">View weekly packages</p>
            </div>
          </Link>
          <Link
            href="/my-journal"
            className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
          >
            <PenSquare className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-semibold">Mistake Journal</p>
              <p className="text-xs text-muted-foreground">Track your mistakes</p>
            </div>
          </Link>
          <Link
            href="/pre-class"
            className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
          >
            <BookOpen className="h-8 w-8 text-primary" />
            <div className="text-center">
              <p className="font-semibold">Pre-Class</p>
              <p className="text-xs text-muted-foreground">Entry ticket & prep</p>
            </div>
          </Link>
        </div>

        {/* Published Worksheets — students go to /my-work */}
        {published.worksheets.length > 0 && (
          <Link href="/my-work" className="rounded-xl border bg-card p-6 block hover:bg-accent transition-colors">
            <h2 className="mb-2 text-lg font-semibold">Published Worksheets</h2>
            <p className="text-sm text-muted-foreground">{published.worksheets.length} worksheet{published.worksheets.length > 1 ? "s" : ""} available for your grade.</p>
            <div className="mt-3 space-y-2">
              {published.worksheets.slice(0, 3).map((ws: any) => {
                const sub = published.submissions?.[ws.id]
                return (
                  <div key={ws.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{ws.title}</p>
                      <p className="text-xs text-muted-foreground">Grade {ws.grade}{ws.week_number ? ` · Week ${ws.week_number}` : ""}</p>
                      {ws.subject && (() => {
                        const s = SUBJECTS.find(x => x.code === ws.subject)
                        return <span className="text-[10px] text-muted-foreground">{s ? `${s.icon} ${s.name}` : ws.subject}</span>
                      })()}
                    </div>
                    {sub && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        sub.allReturned ? 'bg-green-100 text-green-700' :
                        sub.allGraded ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{sub.status}</span>
                    )}
                  </div>
                )
              })}
              {published.worksheets.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">+{published.worksheets.length - 3} more → Go to My Work</p>
              )}
            </div>
          </Link>
        )}

        {/* Published Syllabi + Plans — students go to /pre-class */}
        {(published.syllabi.length > 0 || published.syllabus_plans?.length > 0) && (
          <Link href="/pre-class" className="rounded-xl border bg-card p-6 block hover:bg-accent transition-colors">
            <h2 className="mb-2 text-lg font-semibold">Syllabus Assignments</h2>
            <p className="text-sm text-muted-foreground">{published.syllabi.length + (published.syllabus_plans?.length || 0)} syllabus item(s) available.</p>
            <div className="mt-3 space-y-2">
              {published.syllabi.slice(0, 2).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium">{doc.file_name}</span>
                </div>
              ))}
              {(published.syllabus_plans || []).slice(0, 2).map((sp: any) => (
                <div key={sp.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                  <span className="text-sm font-medium">{sp.topic || "Syllabus Plan"}{sp.week_number ? ` (Week ${sp.week_number})` : ""}</span>
                  {sp.subject && (() => {
                    const s = SUBJECTS.find(x => x.code === sp.subject)
                    return <span className="text-[10px] text-muted-foreground ml-auto">{s ? `${s.icon} ${s.name}` : sp.subject}</span>
                  })()}
                </div>
              ))}
              {(published.syllabi.length + (published.syllabus_plans?.length || 0)) > 4 && (
                <p className="text-xs text-muted-foreground text-center">+ more → Go to Pre-Class</p>
              )}
            </div>
          </Link>
        )}

        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-2 text-lg font-semibold">Grade {profile?.grade_assigned}</h2>
          <p className="text-sm text-muted-foreground">
            You are enrolled in Grade {profile?.grade_assigned}. Your weekly packages,
            journals, and pre-class work are available above.
          </p>
        </div>
      </div>
    )
  }

  const totalPackages = packages?.length ?? 0
  const publishedCount = packages?.filter((p) => p.status === "published").length ?? 0
  const pendingCount = packages?.filter((p) => p.status === "pending_review").length ?? 0
  const draftCount = packages?.filter((p) => p.status === "draft").length ?? 0

  const recentPackages = packages?.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of all grade packages and quick actions.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Packages" value={totalPackages} icon={FileText} />
        <StatCard label="Published" value={publishedCount} icon={CheckCircle2} variant="success" />
        <StatCard label="Pending Review" value={pendingCount} icon={Clock} variant="warning" />
        <StatCard label="Drafts" value={draftCount} icon={AlertCircle} variant="destructive" />
      </div>

      {canManagePackages && (
        <div className="flex flex-wrap gap-3">
          <Link
            href={ROUTES.GENERATE}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Generate All Packages
          </Link>
          <Link
            href={ROUTES.CALENDAR}
            className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Calendar className="h-4 w-4" />
            Upload Calendar
          </Link>
          {isSuperAdmin || isTeacher ? (
            <Link
              href={ROUTES.ANALYTICS}
              className="inline-flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
          ) : null}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Grade Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {GRADES.map((grade) => {
              const gradePackages = packages?.filter((p) => p.grade === grade) ?? []
              const gradePublished = gradePackages.filter((p) => p.status === "published").length
              const gradePending = gradePackages.filter((p) => p.status === "pending_review").length

              return (
                <Link
                  key={grade}
                  href={`${ROUTES.GRADES}?grade=${grade}`}
                  className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between">
                    <FlaskConical className="h-5 w-5 text-primary" />
                    <StatusBadge
                        status={
                          gradePublished > 0
                            ? "published"
                            : gradePending > 0
                              ? "pending_review"
                              : "draft"
                        }
                    />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{GRADE_LABELS[grade]}</p>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>{gradePackages.length} packages</span>
                    <span>{gradePublished} published</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : recentPackages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No packages yet. Generate your first one!</p>
          ) : (
            <div className="space-y-2">
              {recentPackages.map((pkg) => (
                <div key={pkg.id} className="rounded-lg border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{pkg.title}</span>
                    <StatusBadge status={pkg.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Grade {pkg.grade} &middot; Week {pkg.week}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
