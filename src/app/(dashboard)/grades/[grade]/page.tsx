"use client"

import { useParams, useRouter } from "next/navigation"
import { usePackages, useCreatePackage } from "@/hooks/use-packages"
import { useRBAC } from "@/hooks/use-rbac"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import WeekStatusBadge from "@/components/dashboard/WeekStatusBadge"
import { Plus, Eye, Edit, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

const CURRENT_WEEK = 1

export default function GradePackagesPage() {
  const params = useParams()
  const router = useRouter()
  const grade = Number(params.grade)
  const { data: packages, isLoading } = usePackages({ grade })
  const { mutateAsync: createPackage } = useCreatePackage()
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canEdit = isSuperAdmin || isTeacher

  if (!isSuperAdmin && !isTeacher) {
    return <div className="flex h-64 items-center justify-center text-muted-foreground">Access denied.</div>
  }

  const existingWeekNumbers = new Set(packages?.map((p) => p.week) ?? [])
  const needsCurrentWeek = !existingWeekNumbers.has(CURRENT_WEEK)

  async function handleGenerateCurrent() {
    try {
      await createPackage({
        grade,
        week: CURRENT_WEEK,
        title: `Grade ${grade} - Week ${CURRENT_WEEK}`,
      })
      toast.success("Package created for current week!")
    } catch {
      toast.error("Failed to create package.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Grade {grade}</h1>
          <p className="text-muted-foreground">Weekly packages for Grade {grade}</p>
        </div>
        {canEdit && needsCurrentWeek && (
          <Button onClick={handleGenerateCurrent} className="w-full sm:w-auto">
            <Plus className="mr-1 h-4 w-4" />
            Generate Week {CURRENT_WEEK}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : packages && packages.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Topic</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">Week {pkg.week}</TableCell>
                    <TableCell>{pkg.title}</TableCell>
                    <TableCell>
                      <WeekStatusBadge status={pkg.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/grades/${grade}/${pkg.week}/${(pkg.topic ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        {canEdit && (
                          <Link href={`/grades/${grade}/${pkg.week}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No packages for this grade yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
