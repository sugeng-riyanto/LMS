"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"
import { PACKAGE_STATUS_LABELS } from "@/lib/utils/constants"
import type { PackageStatus } from "@/lib/utils/constants"

const statusColors: Record<PackageStatus, string> = {
  draft: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending_review: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-primary",
  approved: "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400",
  published: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-400",
  archived: "bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-900/30 dark:text-gray-400",
}

interface WeekStatusBadgeProps {
  status: string
}

export default function WeekStatusBadge({ status }: WeekStatusBadgeProps) {
  const label = PACKAGE_STATUS_LABELS[status as PackageStatus] ?? status

  return (
    <Badge
      className={cn(
        "border-0",
        statusColors[status as PackageStatus] ?? "bg-muted text-muted-foreground"
      )}
    >
      {label}
    </Badge>
  )
}
