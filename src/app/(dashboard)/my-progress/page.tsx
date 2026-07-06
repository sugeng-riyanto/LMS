"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/use-auth"
import SubjectTabs from "@/components/ui/subject-tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BarChart3, PieChart, TrendingUp, Award, BookOpen, RefreshCw, Download, Filter, Search } from "lucide-react"
import toast from "react-hot-toast"

interface BreakdownItem {
  category: string
  label: string
  count: number
  average: number
  weighted: number
  weight: number
  items: Array<{ id: string; question_text: string; score: number; max_score: number; submitted_at: string }>
}

interface ProgressData {
  student: { full_name: string; grade_assigned: number }
  total_work: number
  weighted_total: number
  breakdown: BreakdownItem[]
}

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"]

function PieChartVis({ data, weightedTotal }: { data: { label: string; value: number; color: string }[]; weightedTotal: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  let cumulative = 0
  const segments = data.map((d) => {
    const start = (cumulative / total) * 360
    cumulative += d.value
    const end = (cumulative / total) * 360
    return { ...d, start, end }
  })

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 100 100" className="w-48 h-48 shrink-0">
        {segments.map((s, i) => {
          const r = 40
          const cx = 50, cy = 50
          const startRad = ((s.start - 90) * Math.PI) / 180
          const endRad = ((s.end - 90) * Math.PI) / 180
          const x1 = cx + r * Math.cos(startRad)
          const y1 = cy + r * Math.sin(startRad)
          const x2 = cx + r * Math.cos(endRad)
          const y2 = cy + r * Math.sin(endRad)
          const largeArc = s.end - s.start > 180 ? 1 : 0
          return (
            <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={s.color} stroke="#fff" strokeWidth={1} />
          )
        })}
        <circle cx={50} cy={50} r={25} fill="#fff" />
        <text x={50} y={48} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#1a1a2e">
          {weightedTotal.toFixed(1)}%
        </text>
        <text x={50} y={60} textAnchor="middle" fontSize={6} fill="#64748b">total</text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
            <span className="w-20 text-muted-foreground">{d.label}</span>
            <span className="font-medium">{d.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChartVis({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 text-xs text-muted-foreground truncate">{d.label}</span>
          <div className="flex-1 rounded-full bg-muted h-5">
            <div className="h-5 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
              style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%`, backgroundColor: d.color, minWidth: d.value > 0 ? "2rem" : "0" }}>
              {d.value > 0 && `${d.value.toFixed(1)}%`}
            </div>
          </div>
          <span className="w-12 text-right text-xs font-medium">{d.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  )
}

export default function MyProgressPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [subjectFilter, setSubjectFilter] = useState("all")

  function fetchProgress() {
    setLoading(true)
    const subjectParam = subjectFilter !== "all" ? `?subject=${subjectFilter}` : ""
    fetch(`/api/student/progress${subjectParam}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error("Failed to load progress"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProgress() }, [subjectFilter])

  const getGradeColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getGradeLabel = (score: number) => {
    if (score >= 90) return "A (Excellent)"
    if (score >= 80) return "B (Good)"
    if (score >= 70) return "C (Satisfactory)"
    if (score >= 60) return "D (Needs Improvement)"
    return "E (Below Expectation)"
  }

  const breakdown = data?.breakdown ?? []
  const pieData = breakdown.map((b, i) => ({ label: b.label, value: b.average, color: COLORS[i % COLORS.length] }))
  const barData = breakdown.map((b, i) => ({ label: b.label, value: b.weighted, color: COLORS[i % COLORS.length] }))
  const maxBar = Math.max(...barData.map((b) => b.value), 1)

  // Flatten all items from all categories with weight info
  const allItems = useMemo(() => {
    return breakdown.flatMap((b) =>
      b.items.map((item) => ({
        ...item,
        category: b.category,
        label: b.label,
        weight: b.weight,
      }))
    ).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
  }, [breakdown])

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      if (catFilter !== "all" && item.category !== catFilter) return false
      if (searchTerm && !item.question_text.toLowerCase().includes(searchTerm.toLowerCase())) return false
      return true
    })
  }, [allItems, catFilter, searchTerm])

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  function exportCSV() {
    const rows = [["Date", "Title", "Category", "Score", "Max", "Weight", "Weighted %"]]
    allItems.forEach((item) => {
      const pct = item.max_score > 0 ? (item.score / item.max_score) * 100 : 0
      rows.push([
        new Date(item.submitted_at).toLocaleDateString(),
        `"${item.question_text.replace(/"/g, '""')}"`,
        item.label,
        item.score.toString(),
        item.max_score.toString(),
        (item.weight * 100).toFixed(0) + "%",
        pct.toFixed(1) + "%"
      ])
    })
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-progress.csv"; a.click()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
          <p className="text-sm text-muted-foreground">
            {data?.student?.full_name ?? "Student"} — Grade {data?.student?.grade_assigned ?? "—"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProgress}>
          <RefreshCw className="mr-1 h-3 w-3" /> Refresh
        </Button>
      </div>

      <SubjectTabs value={subjectFilter} onChange={setSubjectFilter} />

      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            <p className="text-sm text-muted-foreground">Overall Weighted Score</p>
            <p className={`text-4xl font-bold ${getGradeColor(data?.weighted_total ?? 0)}`}>
              {data?.weighted_total?.toFixed(1) ?? "0.0"}%
            </p>
            <Badge variant="outline" className="text-xs">
              {getGradeLabel(data?.weighted_total ?? 0)}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Based on {data?.total_work ?? 0} graded submissions
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Average Score by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No graded work yet.</p>
            ) : (
              <PieChartVis data={pieData} weightedTotal={data?.weighted_total ?? 0} />
            )}
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Weighted Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No graded work yet.</p>
            ) : (
              <BarChartVis data={barData} maxVal={maxBar} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left font-medium">Category</th>
                  <th className="p-2 text-center font-medium">Weight</th>
                  <th className="p-2 text-center font-medium">Items</th>
                  <th className="p-2 text-center font-medium">Average</th>
                  <th className="p-2 text-center font-medium">Weighted</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((b, i) => (
                  <tr key={b.category} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span>{b.label}</span>
                      </div>
                    </td>
                    <td className="p-2 text-center">{(b.weight * 100).toFixed(0)}%</td>
                    <td className="p-2 text-center">{b.count}</td>
                    <td className={`p-2 text-center font-medium ${getGradeColor(b.average)}`}>{b.average.toFixed(1)}%</td>
                    <td className={`p-2 text-center font-medium ${getGradeColor(b.weighted)}`}>{b.weighted.toFixed(1)}%</td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-medium">
                  <td className="p-2">Total</td>
                  <td className="p-2 text-center">100%</td>
                  <td className="p-2 text-center">{data?.total_work ?? 0}</td>
                  <td className="p-2 text-center">—</td>
                  <td className={`p-2 text-center ${getGradeColor(data?.weighted_total ?? 0)}`}>
                    {data?.weighted_total?.toFixed(1) ?? "0.0"}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Weight Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Grading Weight Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Classwork", weight: "40%", color: COLORS[0] },
              { label: "Unit Test", weight: "20%", color: COLORS[1] },
              { label: "Project", weight: "10%", color: COLORS[2] },
              { label: "Homework", weight: "10%", color: COLORS[3] },
              { label: "Mid Semester", weight: "10%", color: COLORS[4] },
              { label: "Final Semester", weight: "10%", color: COLORS[5] },
            ].map((r) => (
              <div key={r.label} className="rounded-lg border p-3 text-center">
                <div className="text-lg font-bold" style={{ color: r.color }}>{r.weight}</div>
                <div className="text-xs text-muted-foreground">{r.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filterable Assignments Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Assignments
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search title..." className="h-8 w-36 text-xs pl-7" />
              </div>
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="all">All Categories</option>
                {breakdown.map((b) => (<option key={b.category} value={b.category}>{b.label}</option>))}
              </select>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={exportCSV}>
                <Download className="mr-1 h-3 w-3" />CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-1.5 text-left font-medium">Date</th>
                    <th className="p-1.5 text-left font-medium">Title</th>
                    <th className="p-1.5 text-center font-medium">Category</th>
                    <th className="p-1.5 text-center font-medium">Score</th>
                    <th className="p-1.5 text-center font-medium">Max</th>
                    <th className="p-1.5 text-center font-medium">Weight</th>
                    <th className="p-1.5 text-center font-medium">Weighted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const pct = item.max_score > 0 ? (item.score / item.max_score) * 100 : 0
                    const weighted = pct * item.weight
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="p-1.5 whitespace-nowrap">{new Date(item.submitted_at).toLocaleDateString()}</td>
                        <td className="p-1.5 max-w-48 truncate">{item.question_text}</td>
                        <td className="p-1.5 text-center">
                          <Badge variant="outline" className="text-[9px]">{item.label}</Badge>
                        </td>
                        <td className={`p-1.5 text-center font-medium ${getGradeColor(pct)}`}>{item.score}</td>
                        <td className="p-1.5 text-center text-muted-foreground">{item.max_score}</td>
                        <td className="p-1.5 text-center">{(item.weight * 100).toFixed(0)}%</td>
                        <td className="p-1.5 text-center font-medium">{weighted.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredItems.length < allItems.length && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Showing {filteredItems.length} of {allItems.length} assignments
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
