"use client"

import { usePackages } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
import Link from "next/link"
import { FlaskConical, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { GRADES, GRADE_LABELS, ROUTES } from "@/lib/utils/constants"

export default function GradesPage() {
  const { data: packages, isLoading } = usePackages()
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canView = isSuperAdmin || isTeacher

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">Select a grade to manage weekly physics packages</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GRADES.map((grade) => {
            const gradePackages = packages?.filter((p) => p.grade === grade) ?? []
            const published = gradePackages.filter((p) => p.status === "published").length
            const pending = gradePackages.filter((p) => p.status === "pending_review").length
            const draft = gradePackages.filter((p) => p.status === "draft").length
            const dominantStatus =
              published > 0 ? "published" : pending > 0 ? "pending_review" : "draft"

            return (
              <Link
                key={grade}
                href={`/grades/${grade}`}
                className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FlaskConical className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-semibold">Grade {grade}</p>
                      <p className="text-xs text-muted-foreground">{GRADE_LABELS[grade]}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[dominantStatus],
                    )}
                  >
                    {dominantStatus.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-muted-foreground">{gradePackages.length}</p>
                    <p className="text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">{published}</p>
                    <p className="text-muted-foreground">Published</p>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-600">{draft}</p>
                    <p className="text-muted-foreground">Draft</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium">Published</p>
            <p className="text-xs text-muted-foreground">
              {packages?.filter((p) => p.status === "published").length ?? 0} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <Clock className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-sm font-medium">Pending Review</p>
            <p className="text-xs text-muted-foreground">
              {packages?.filter((p) => p.status === "pending_review").length ?? 0} total
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border p-4">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium">Draft</p>
            <p className="text-xs text-muted-foreground">
              {packages?.filter((p) => p.status === "draft").length ?? 0} total
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
