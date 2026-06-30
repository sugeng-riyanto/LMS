"use client"

import { Card, CardContent } from "@/components/ui/card"
import WeekStatusBadge from "./WeekStatusBadge"
import { GRADE_LABELS } from "@/lib/utils/constants"
import type { Grade } from "@/lib/utils/constants"

interface GradeCardProps {
  grade: number
  weekNumber: number
  status: string
  topic?: string
  onView: () => void
}

export default function GradeCard({ grade, weekNumber, status, topic, onView }: GradeCardProps) {
  const gradeLabel = GRADE_LABELS[grade as Grade] ?? `Grade ${grade}`

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-accent/50"
      onClick={onView}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onView() }}
      tabIndex={0}
      role="button"
      aria-label={`View ${gradeLabel} week ${weekNumber}`}
    >
      <CardContent className="flex items-start justify-between p-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{gradeLabel}</p>
          <p className="text-sm font-semibold">Week {weekNumber}</p>
          {topic && (
            <p className="text-xs text-muted-foreground line-clamp-1">{topic}</p>
          )}
        </div>
        <WeekStatusBadge status={status} />
      </CardContent>
    </Card>
  )
}
