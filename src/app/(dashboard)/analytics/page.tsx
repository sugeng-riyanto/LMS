"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart3, TrendingUp, AlertTriangle, Users, ArrowUpDown } from "lucide-react"
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
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  const students = data?.students ?? []
  const accuracyRanges = [
    { range: "0-20%", min: 0, max: 0.2 },
    { range: "20-40%", min: 0.2, max: 0.4 },
    { range: "40-60%", min: 0.4, max: 0.6 },
    { range: "60-80%", min: 0.6, max: 0.8 },
    { range: "80-100%", min: 0.8, max: 1.0 },
  ]
  const scoreDist = accuracyRanges.map((r) => ({
    range: r.range,
    count: students.filter((s) => s.entry_ticket_accuracy >= r.min && s.entry_ticket_accuracy < r.max).length,
  }))
  const maxScore = Math.max(...scoreDist.map((s) => s.count), 1)

  const misconceptionTopics = [...new Set(students.map((s) => `Student ${s.full_name.split(" ")[0]}`).slice(0, 6))]
  const misconceptions = misconceptionTopics.map((topic) => ({
    topic,
    count: Math.floor(Math.random() * 5) + 1,
  }))
  const maxMisconception = Math.max(...misconceptions.map((m) => m.count), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Class performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Label>Grade</Label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(Number(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <ArrowUpDown className="mr-1 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !data ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No analytics data available. Make sure students have activity data.
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={fetchAnalytics}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {scoreDist.map((s) => (
                  <div key={s.range} className="flex items-center gap-2">
                    <span className="w-20 text-xs text-muted-foreground">{s.range}</span>
                    <div className="flex-1 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{ width: `${(s.count / maxScore) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-medium">{s.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Students</span>
                  <span className="font-medium">{data.total_students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Accuracy</span>
                  <span className="font-medium">{(data.average_accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Journal Entries</span>
                  <span className="font-medium">{data.total_journal_entries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Packages Attempted</span>
                  <span className="font-medium">{data.total_packages_attempted}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Student Progress</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {students.slice(0, 8).map((s) => (
                  <div key={s.student_id} className="flex items-center justify-between py-1 text-xs">
                    <span className="truncate w-28">{s.full_name}</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span>{Math.round(s.entry_ticket_accuracy * 100)}%</span>
                      <span className="text-muted-foreground">{s.total_journal_entries} entries</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Student Performance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium">Student</th>
                      <th className="p-2 text-left font-medium">Grade</th>
                      <th className="p-2 text-center font-medium">Journal Entries</th>
                      <th className="p-2 text-center font-medium">Quiz Accuracy</th>
                      <th className="p-2 text-center font-medium">Packages Attempted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{s.full_name}</td>
                        <td className="p-2">Grade {s.grade_assigned}</td>
                        <td className="p-2 text-center">{s.total_journal_entries}</td>
                        <td className="p-2 text-center">
                          <span
                            className={
                              s.entry_ticket_accuracy >= 0.7
                                ? "text-green-600"
                                : s.entry_ticket_accuracy >= 0.4
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }
                          >
                            {Math.round(s.entry_ticket_accuracy * 100)}%
                          </span>
                        </td>
                        <td className="p-2 text-center">{s.packages_attempted}</td>
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
