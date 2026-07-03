"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BarChart3, TrendingUp, AlertTriangle, Users, ArrowUpDown, BookOpen, BrainCircuit, GraduationCap, CheckCircle2, Download } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

interface StudentRow {
  student_id: string
  full_name: string
  grade_assigned: number
  total_journal_entries: number
  entry_ticket_accuracy: number
  packages_attempted: number
}

interface AnalyticsData {
  total_students: number
  average_accuracy: number
  total_journal_entries: number
  total_packages_attempted: number
  students: StudentRow[]
}

export default function AnalyticsPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canView = isSuperAdmin || isTeacher
  const [filterGrade, setFilterGrade] = useState<number>(7)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (canView) fetchAnalytics()
  }, [filterGrade])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?grade=${filterGrade}`)
      if (res.ok) setData(await res.json())
      else setData(null)
    } catch {
      toast.error("Failed to load analytics.")
    } finally {
      setLoading(false)
    }
  }

  if (!canView) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">You do not have access to this page.</p></div>
  }

  const [scoreData, setScoreData] = useState<any>(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  useEffect(() => {
    if (canView) {
      setScoreLoading(true)
      fetch(`/api/analytics/scores?grade=${filterGrade}`)
        .then(r => r.json()).then(d => setScoreData(d)).catch(() => {}).finally(() => setScoreLoading(false))
    }
  }, [filterGrade])

  const students = data?.students ?? []
  const lowPerformers = students.filter((s) => s.entry_ticket_accuracy < 0.4)
  const highPerformers = students.filter((s) => s.entry_ticket_accuracy >= 0.8)
  const avg = data?.average_accuracy ?? 0

  const accuracyRanges = [
    { range: "0-20%", min: 0, max: 0.2, color: "bg-red-500" },
    { range: "21-40%", min: 0.2, max: 0.4, color: "bg-orange-500" },
    { range: "41-60%", min: 0.4, max: 0.6, color: "bg-yellow-500" },
    { range: "61-80%", min: 0.6, max: 0.8, color: "bg-blue-500" },
    { range: "81-100%", min: 0.8, max: 1.0, color: "bg-green-500" },
  ]
  const scoreDist = accuracyRanges.map((r) => ({
    ...r,
    count: students.filter((s) => s.entry_ticket_accuracy >= r.min && s.entry_ticket_accuracy < r.max).length,
  }))
  const maxScore = Math.max(...scoreDist.map((s) => s.count), 1)

  const totalEntries = students.reduce((sum, s) => sum + s.total_journal_entries, 0)
  const totalPackages = students.reduce((sum, s) => sum + s.packages_attempted, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Class performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Label>Grade</Label>
          <select value={filterGrade} onChange={(e) => setFilterGrade(Number(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}><ArrowUpDown className="mr-1 h-4 w-4" />Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />))}
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No analytics data available. Make sure students have activity data.
            <div className="mt-4"><Button variant="outline" size="sm" onClick={fetchAnalytics}>Retry</Button></div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{data.total_students}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${avg >= 0.7 ? "text-green-600" : avg >= 0.4 ? "text-amber-600" : "text-red-600"}`}>
                  {(avg * 100).toFixed(0)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{totalEntries}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Packages</CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{totalPackages}</p></CardContent>
            </Card>
          </div>

          {/* Score Distribution + Summary + Alert */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle className="text-sm">Score Distribution</CardTitle></CardHeader>
              <CardContent>
                {scoreDist.map((s) => (
                  <div key={s.range} className="flex items-center gap-2 py-1">
                    <span className="w-20 text-xs text-muted-foreground">{s.range}</span>
                    <div className="flex-1 rounded-full bg-muted">
                      <div className={`h-3 rounded-full ${s.color}`} style={{ width: `${(s.count / maxScore) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-medium">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Performance Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                  <Users className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">{'High Achievers (\u226580%)'}</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{highPerformers.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Needs Attention {'(<40%)'}</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{lowPerformers.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{data.total_students > 0 ? `${(highPerformers.length / data.total_students * 100).toFixed(0)}% students are on track` : "No data"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Low Performers</CardTitle></CardHeader>
              <CardContent>
                {lowPerformers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All students are performing well!</p>
                ) : (
                  <div className="space-y-2">
                    {lowPerformers.slice(0, 5).map((s) => (
                      <div key={s.student_id} className="flex items-center justify-between text-sm">
                        <span className="truncate w-28">{s.full_name}</span>
                        <Badge variant="destructive" className="text-xs">{Math.round(s.entry_ticket_accuracy * 100)}%</Badge>
                      </div>
                    ))}
                    {lowPerformers.length > 5 && <p className="text-xs text-muted-foreground">+{lowPerformers.length - 5} more</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Recap Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Score Recap — Grade {filterGrade}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => {
                  if (!scoreData?.students) return
                  const rows = [["Student", ...scoreData.summary.map((s: any) => s.label), "Weighted Total"]]
                  scoreData.students.forEach((st: any) => {
                    rows.push([st.full_name, ...st.breakdown.map((b: any) => b.average.toFixed(1)), st.weighted_total.toFixed(1)])
                  })
                  rows.push(["Grade Avg", ...scoreData.summary.map((s: any) => s.average.toFixed(1)), scoreData.grand_weighted_total.toFixed(1)])
                  const csv = rows.map(r => r.join(",")).join("\n")
                  const blob = new Blob([csv], { type: "text/csv" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a"); a.href = url; a.download = `scores-grade-${filterGrade}.csv`; a.click()
                  URL.revokeObjectURL(url)
                }}>
                  <Download className="mr-1 h-4 w-4" />CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {scoreLoading ? (
                <div className="h-32 animate-pulse rounded bg-muted" />
              ) : !scoreData ? (
                <p className="text-sm text-muted-foreground">No score data.</p>
              ) : (
                <div className="space-y-6">
                  {/* Grade Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {scoreData.summary.map((s: any) => (
                      <div key={s.category} className="rounded-lg border p-2 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                        <p className="text-lg font-bold">{s.average.toFixed(1)}</p>
                        <p className="text-[10px] text-muted-foreground">w={s.weight*100}% · {s.count} items</p>
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="text-sm px-4 py-1">
                      Weighted Total: <strong>{scoreData.grand_weighted_total.toFixed(1)}</strong> · {scoreData.total_submissions} submissions
                    </Badge>
                  </div>

                  {/* Per-Student Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="p-1.5 text-left font-medium">Student</th>
                          {scoreData.summary.map((s: any) => (
                            <th key={s.category} className="p-1.5 text-center font-medium">{s.label}<br /><span className="text-[9px] text-muted-foreground">({s.weight*100}%)</span></th>
                          ))}
                          <th className="p-1.5 text-center font-medium">Total</th>
                          <th className="p-1.5 text-center font-medium">Work</th>
                          <th className="p-1.5 text-center font-medium">Returned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoreData.students.map((st: any) => (
                          <tr key={st.student_id} className="border-b hover:bg-muted/50">
                            <td className="p-1.5 font-medium">{st.full_name}</td>
                            {st.breakdown.map((b: any) => (
                              <td key={b.category} className="p-1.5 text-center">{b.count > 0 ? b.average.toFixed(1) : "-"}</td>
                            ))}
                            <td className="p-1.5 text-center font-bold">{st.weighted_total.toFixed(1)}</td>
                            <td className="p-1.5 text-center">{st.total_work}</td>
                            <td className="p-1.5 text-center">{st.returned_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Full Student Table */}
          <Card>
            <CardHeader><CardTitle>Student Performance Table</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Student</th>
                      <th className="p-2 text-left font-medium">Grade</th>
                      <th className="p-2 text-center font-medium">Journal</th>
                      <th className="p-2 text-center font-medium">Accuracy</th>
                      <th className="p-2 text-center font-medium">Packages</th>
                      <th className="p-2 text-center font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{s.full_name}</td>
                        <td className="p-2">G{s.grade_assigned}</td>
                        <td className="p-2 text-center">{s.total_journal_entries}</td>
                        <td className="p-2 text-center">
                          <span className={s.entry_ticket_accuracy >= 0.7 ? "text-green-600 font-medium" : s.entry_ticket_accuracy >= 0.4 ? "text-amber-600" : "text-red-600 font-medium"}>
                            {Math.round(s.entry_ticket_accuracy * 100)}%
                          </span>
                        </td>
                        <td className="p-2 text-center">{s.packages_attempted}</td>
                        <td className="p-2 text-center">
                          {s.entry_ticket_accuracy >= 0.7 ? <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">On Track</Badge>
                            : s.entry_ticket_accuracy >= 0.4 ? <Badge variant="secondary">Developing</Badge>
                            : <Badge variant="destructive">Needs Help</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
