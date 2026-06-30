"use client"

import { Card, CardContent } from "@/components/ui/card"
import { usePackages } from "@/hooks/use-packages"
import { FileText, CheckCircle2, Clock, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface StatsOverviewProps {
  totalPackages?: number
  published?: number
  pending?: number
  averageScore?: number
}

export default function StatsOverview({
  totalPackages: totalProp,
  published: publishedProp,
  pending: pendingProp,
  averageScore: scoreProp,
}: StatsOverviewProps) {
  const { data: packages } = usePackages()

  const total = totalProp ?? packages?.length ?? 0
  const published = publishedProp ?? packages?.filter((p) => (p as any).status === "published").length ?? 0
  const pending = pendingProp ?? packages?.filter((p) => (p as any).status === "pending_review" || (p as any).status === "pending_approval").length ?? 0
  const avgScore = scoreProp ?? (() => {
    if (!packages || packages.length === 0) return 0
    const scores = packages.map((p) => p.grade).filter(Boolean)
    return scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0
  })()

  const stats = [
    { label: "Total Packages", value: total, icon: FileText, variant: "default" },
    { label: "Published", value: published, icon: CheckCircle2, variant: "success" },
    { label: "Pending Review", value: pending, icon: Clock, variant: "warning" },
    { label: "Average Score", value: avgScore, icon: BarChart3, variant: "default" },
  ] as const

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between p-4">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-3xl font-bold">{stat.value}</p>
              </div>
              <Icon
                className={cn(
                  "h-5 w-5",
                  stat.variant === "success" && "text-green-500",
                  stat.variant === "warning" && "text-amber-500",
                  stat.variant === "default" && "text-primary",
                )}
              />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
