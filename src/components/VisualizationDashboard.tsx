"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart3, PieChart, TrendingUp, Info } from "lucide-react"
import { useRBAC } from "@/hooks/use-rbac"

interface ChartData { label: string; value: number }
interface TeacherAvg { teacher_id: string; teacher_name: string; avg_score: number; count: number }

function svgPie(data: ChartData[], size = 180): string {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const colors = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"]
  let cumulative = 0
  const slices = data.map((d, i) => {
    const pct = d.value / total
    const a1 = cumulative * 360
    const a2 = (cumulative + pct) * 360
    cumulative += pct
    const r = size / 2 - 10, cx = size / 2, cy = size / 2 + 10
    const x1 = cx + r * Math.cos(a1 * Math.PI / 180)
    const y1 = cy + r * Math.sin(a1 * Math.PI / 180)
    const x2 = cx + r * Math.cos(a2 * Math.PI / 180)
    const y2 = cy + r * Math.sin(a2 * Math.PI / 180)
    const large = pct > 0.5 ? 1 : 0
    const midAngle = ((a1 + a2) / 2) * Math.PI / 180
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="1.5" class="chart-slice"/>
      <text x="${cx + r * 0.55 * Math.cos(midAngle)}" y="${cy + r * 0.55 * Math.sin(midAngle)}" text-anchor="middle" font-size="9" fill="#fff" font-weight="bold">${(pct * 100).toFixed(0)}%</text>`
  }).join("")
  return slices
}

function svgBar(data: ChartData[], width = 320, height = 160): string {
  const max = Math.max(...data.map(d => d.value), 1)
  const bw = Math.max(16, Math.floor(width / data.length) - 6)
  const bars = data.map((d, i) => {
    const bh = (d.value / max) * (height - 25)
    const x = i * (bw + 6) + 15
    const y = height - 10 - bh
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="url(#barGrad)" rx="3" class="chart-bar" style="animation-delay:${i * 0.1}s"/>
      <text x="${x + bw / 2}" y="${height - 2}" text-anchor="middle" font-size="7" fill="#666">${d.label.length > 6 ? d.label.slice(0, 6) : d.label}</text>
      <text x="${x + bw / 2}" y="${y - 4}" text-anchor="middle" font-size="8" fill="#333" font-weight="bold">${d.value}</text>`
  }).join("")
  return `<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs>` + bars
}

function svgTimeline(data: ChartData[], width = 400, height = 140): string {
  const max = Math.max(...data.map(d => d.value), 1)
  const step = width / Math.max(data.length, 1)
  const points = data.map((d, i) => {
    const x = i * step + step / 2
    const y = height - 15 - (d.value / max) * (height - 30)
    return `${x},${y}`
  }).join(" ")
  const bars = data.map((d, i) => {
    const x = i * step + step / 2 - 12
    const bh = (d.value / max) * (height - 30)
    const y = height - 15 - bh
    return `<rect x="${x}" y="${y}" width="24" height="${bh}" fill="url(#timelineGrad)" rx="3" class="chart-bar" style="animation-delay:${i * 0.08}s" opacity="0.7"/>`
  }).join("")
  const line = `<polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2.5" class="chart-line"/>`
  const dots = data.map((d, i) => {
    const x = i * step + step / 2
    const y = height - 15 - (d.value / max) * (height - 30)
    return `<circle cx="${x}" cy="${y}" r="4" fill="#1d4ed8" stroke="#fff" stroke-width="2" class="chart-dot" style="animation-delay:${i * 0.1}s"/>`
  }).join("")
  return `<defs><linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#93c5fd"/></linearGradient></defs>` + bars + line + dots
}

function scoreInsight(avg: number): string {
  if (avg >= 80) return "Strong performance — consistently meeting expectations"
  if (avg >= 60) return "Developing — room for improvement in key areas"
  return "Needs attention — consider targeted support"
}

interface Props { apiType: "tpa" | "supervision" }

export default function VisualizationDashboard({ apiType }: Props) {
  const { isTeacher, isPrincipal, isSuperAdmin } = useRBAC()
  const [period, setPeriod] = useState("all")
  const [grade, setGrade] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [month, setMonth] = useState("")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isTeacher) {
      fetch("/api/profiles?role=teacher").then(r => r.ok ? r.json() : []).then(setTeachers).catch(() => {})
    }
  }, [isTeacher])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: apiType, period })
      if (grade) params.set("grade", grade)
      if (teacherId) params.set("teacher_id", teacherId)
      if (month) params.set("month", month)
      const r = await fetch(`/api/analytics/visualizations?${params}`)
      if (r.ok) setData(await r.json())
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { if (show) fetchData() }, [show, period, grade, teacherId, month])

  const totalScore = data ? (
    (Object.values(data.scoreRanges as Record<string, number>) as number[]).reduce((s, v) => s + v, 0) > 0
      ? (Object.entries(data.scoreRanges as Record<string, number>) as [string, number][]).filter(([k]) => k === "80-100").reduce((s, [, v]) => s + v, 0) / Math.max((Object.values(data.scoreRanges as Record<string, number>) as number[]).reduce((s, v) => s + v, 0), 1) * 100
      : 0
  ) : 0

  return (
    <Card className="mt-4 overflow-hidden">
      <CardHeader className="py-3 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span>Analytics & Insights</span>
            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">— {apiType === "tpa" ? "TPA" : "Supervision"} performance</span>
          </CardTitle>
          <Button variant={show ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setShow(!show)}>
            <TrendingUp className="mr-1 h-3 w-3" />{show ? "Hide" : "Show"} Charts
          </Button>
        </div>
      </CardHeader>
      {show && (
        <CardContent className="space-y-4 p-3 sm:p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-[10px]">Period</Label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2 max-w-[100px]">
                <option value="all">All</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semester">Semester</option>
              </select>
            </div>
            {period !== "all" && (
              <div className="space-y-0.5 min-w-0">
                <Label className="text-[10px]">{period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Semester"}</Label>
                <select value={month} onChange={e => setMonth(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2 max-w-[90px]">
                  <option value="">Select</option>
                  {period === "monthly" && Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
                  {period === "quarterly" && [1, 2, 3, 4].map(q => (<option key={q} value={q}>Q{q}</option>))}
                  {period === "semester" && [1, 2].map(s => (<option key={s} value={s}>Sem {s}</option>))}
                </select>
              </div>
            )}
            {!isTeacher && (
              <div className="space-y-0.5 min-w-0">
                <Label className="text-[10px]">Grade</Label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2 max-w-[80px]">
                  <option value="">All</option>
                  {[7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>G{g}</option>)}
                </select>
              </div>
            )}
            {!isTeacher && (
              <div className="space-y-0.5 min-w-0">
                <Label className="text-[10px]">Teacher</Label>
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2 max-w-[130px]">
                  <option value="">All</option>
                  {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name.split(" ")[0]}</option>)}
                </select>
              </div>
            )}
            <Button size="sm" className="h-7 text-xs" onClick={fetchData} disabled={loading}>
              <TrendingUp className="mr-1 h-3 w-3" />{loading ? "..." : "Refresh"}
            </Button>
          </div>

          {isTeacher && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Info className="h-3 w-3" />Showing your data only. Teachers can only see their own records.</p>}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !data ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Click <strong>Refresh</strong> to load analytics.
            </div>
          ) : data.total === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No records found for the selected filters.</p>
          ) : (
            <>
              {/* Insight summary */}
              <div className="rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border p-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-semibold mb-1"><Info className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />Insight Summary</div>
                <p className="text-muted-foreground">
                  {data.total} {apiType === "tpa" ? "assessment(s)" : "supervision(s)"} recorded.
                  {data.teacherAverages?.length > 0 && ` Average score: ${(data.teacherAverages.reduce((s: number, t: TeacherAvg) => s + t.avg_score, 0) / data.teacherAverages.length).toFixed(1)}%.`}
                  {" "}{scoreInsight(data.teacherAverages?.length > 0 ? data.teacherAverages.reduce((s: number, t: TeacherAvg) => s + t.avg_score, 0) / data.teacherAverages.length : 0)}
                </p>
              </div>

              {/* Charts grid */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Score Ranges Pie */}
                {data.scoreRanges && (
                  <div className="rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><PieChart className="h-3 w-3 text-primary" />Score Distribution</h4>
                    <div className="overflow-x-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 220" className="w-full max-w-[180px] mx-auto"
                        dangerouslySetInnerHTML={{
                          __html: svgPie(Object.entries(data.scoreRanges).map(([k, v]) => ({ label: k, value: v as number })))
                            + `<g transform="translate(0,180)">`
                            + Object.entries(data.scoreRanges).map(([k, v], i) =>
                                `<text x="10" y="${i * 14 + 12}" font-size="9" fill="#666">
                                  <tspan fill="${['#3b82f6','#10b981','#f59e0b','#ef4444'][i]}">&#9632;</tspan> ${k}%: ${v}
                                </text>`
                              ).join("")
                            + `</g>`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Grade Distribution */}
                {data.gradeDistribution?.length > 0 && (
                  <div className="rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30">
                    <h4 className="text-xs font-semibold mb-2">Grade Distribution</h4>
                    <div className="overflow-x-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" className="w-full min-w-[280px]"
                        dangerouslySetInnerHTML={{ __html: svgBar(data.gradeDistribution) }} />
                    </div>
                  </div>
                )}

                {/* Monthly Trend */}
                {data.monthlyTrend?.length > 0 && (
                  <div className="rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 sm:col-span-2 lg:col-span-1">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3 text-primary" />Timeline</h4>
                    <div className="overflow-x-auto">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 140" className="w-full min-w-[300px]"
                        dangerouslySetInnerHTML={{ __html: svgTimeline(data.monthlyTrend) }} />
                    </div>
                  </div>
                )}

                {/* Status Distribution */}
                {data.statusDistribution?.length > 0 && (
                  <div className="rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30">
                    <h4 className="text-xs font-semibold mb-2">Status</h4>
                    <div className="space-y-1.5">
                      {data.statusDistribution.map((s: ChartData) => {
                        const maxVal = Math.max(...data.statusDistribution.map((x: ChartData) => x.value), 1)
                        return (
                          <div key={s.label} className="flex items-center gap-2 text-xs group cursor-default">
                            <span className="w-16 sm:w-20 capitalize font-medium truncate">{s.label}</span>
                            <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-700"
                                style={{ width: `${(s.value / maxVal) * 100}%` }} />
                            </div>
                            <span className="w-6 text-right font-bold">{s.value}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Teacher Averages */}
                {data.teacherAverages?.length > 0 && (
                  <div className="rounded-xl border bg-card p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30 sm:col-span-2 lg:col-span-3">
                    <h4 className="text-xs font-semibold mb-2">Teacher Performance</h4>
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {data.teacherAverages.map((t: TeacherAvg) => (
                        <div key={t.teacher_id} className="flex items-center gap-2 text-xs rounded-lg bg-muted/30 px-2.5 py-2 transition-all duration-200 hover:bg-muted/60 hover:shadow-sm cursor-default border border-transparent hover:border-border">
                          <span className="flex-1 font-medium truncate">{t.teacher_name}</span>
                          <span className="text-[10px] text-muted-foreground">{t.count} ×</span>
                          <span className={`font-bold text-sm ${t.avg_score >= 80 ? 'text-green-600' : t.avg_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {t.avg_score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground text-center">Total: {data.total} record(s) · Last updated: {new Date().toLocaleDateString()}</p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}
