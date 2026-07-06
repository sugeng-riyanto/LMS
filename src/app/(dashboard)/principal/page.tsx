"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Users, BookOpen, CheckCircle, Clock, BarChart3, GraduationCap, TrendingUp, AlertTriangle, Download, RefreshCw } from "lucide-react"
import Link from "next/link"

const CAT_LABELS: Record<string, string> = { classwork: "Classwork", unit_test: "Unit Test", project: "Project", homework: "Homework", mid_semester: "Mid Semester", final_semester: "Final Semester" }
const COLORS = ["#4f7bdf", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899"]

export default function PrincipalDashboard() {
  const { profile } = useAuth()
  const { isPrincipal, role } = useRBAC()
  const [analytics, setAnalytics] = useState<any>(null)
  const [scoreData, setScoreData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPrincipal) return
    Promise.all([
      fetch("/api/analytics?grade=all").then(r => r.json()).catch(() => null),
      fetch("/api/analytics/scores").then(r => r.json()).catch(() => null),
    ]).then(([a, s]) => {
      setAnalytics(a)
      setScoreData(s)
      setLoading(false)
    })
  }, [isPrincipal])

  const students = analytics?.students ?? []
  const highPerformers = students.filter((s: any) => s.entry_ticket_accuracy >= 0.8)
  const lowPerformers = students.filter((s: any) => s.entry_ticket_accuracy < 0.4)
  const breakdown = scoreData?.summary ?? []
  const studentsWithScores = scoreData?.students ?? []

  // Aggregate by grade
  const gradeAgg = useMemo(() => {
    const map: Record<number, { count: number; weighted: number[] }> = {}
    studentsWithScores.forEach((st: any) => {
      if (!map[st.grade_assigned]) map[st.grade_assigned] = { count: 0, weighted: [] }
      map[st.grade_assigned].count++
      map[st.grade_assigned].weighted.push(st.weighted_total || 0)
    })
    return Object.entries(map).map(([g, d]) => ({
      grade: Number(g),
      count: d.count,
      avg: d.weighted.length > 0 ? (d.weighted.reduce((a: number, b: number) => a + b, 0) / d.weighted.length) : 0,
      min: Math.min(...d.weighted),
      max: Math.max(...d.weighted),
    })).sort((a, b) => a.grade - b.grade)
  }, [studentsWithScores])

  // Category average
  const catAvg = useMemo(() => {
    return breakdown.map((b: any) => ({ label: CAT_LABELS[b.category] || b.category, value: b.average || 0, weight: b.weight || 0 }))
  }, [breakdown])

  if (!isPrincipal) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Principal Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {profile?.full_name?.split(" ")[0] ?? "Principal"} — {role === 'principal' ? 'School Performance Overview' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-1 h-4 w-4" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{analytics?.total_students ?? "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">High Achievers (&ge;80%)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{highPerformers.length}</p>
                <p className="text-xs text-muted-foreground">{students.length > 0 ? `${(highPerformers.length / students.length * 100).toFixed(0)}% of students` : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Needs Attention (&lt;40%)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">{lowPerformers.length}</p>
                <p className="text-xs text-muted-foreground">{students.length > 0 ? `${(lowPerformers.length / students.length * 100).toFixed(0)}% of students` : "—"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
                <CheckCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{scoreData?.total_submissions ?? "—"}</p></CardContent>
            </Card>
          </div>

          {/* Grade Overview + Category Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Grade Performance */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GraduationCap className="h-4 w-4" />Grade Performance</CardTitle></CardHeader>
              <CardContent>
                {gradeAgg.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No score data available.</p>
                ) : (
                  <div className="space-y-4">
                    {gradeAgg.map((g) => (
                      <div key={g.grade}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Grade {g.grade}</span>
                          <span className="text-muted-foreground">{g.count} students · Avg: <strong>{g.avg.toFixed(1)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Min: {g.min.toFixed(1)}</span>
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(g.avg / 100) * 100}%` }} />
                          </div>
                          <span>Max: {g.max.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Score Categories</CardTitle></CardHeader>
              <CardContent>
                {catAvg.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No category data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {catAvg.map((c: { label: string; value: number; weight: number }, i: number) => (
                      <div key={c.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{c.label}</span>
                          <span className="font-medium">{c.value.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(c.value / 100) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Weighted Total</span>
                      <span>{scoreData?.grand_weighted_total?.toFixed(1) ?? "—"}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/analytics" className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Full Analytics</p>
                  <p className="text-xs text-muted-foreground">Detailed breakdown per grade & subject</p>
                </div>
              </div>
            </Link>
            <Link href="/grades" className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Grade Packages</p>
                  <p className="text-xs text-muted-foreground">Review weekly packages per grade</p>
                </div>
              </div>
            </Link>
            <Link href="/calendar" className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Calendar</p>
                  <p className="text-xs text-muted-foreground">Academic events and schedule</p>
                </div>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
