"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BarChart3, PieChart, TrendingUp, Download } from "lucide-react"
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
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${colors[i % colors.length]}" stroke="#fff" stroke-width="1"/>
      <text x="${cx + r * 0.55 * Math.cos(midAngle)}" y="${cy + r * 0.55 * Math.sin(midAngle)}" text-anchor="middle" font-size="9" fill="#fff">${(pct * 100).toFixed(0)}%</text>`
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
    return `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="#3b82f6" rx="2"/>
      <text x="${x + bw / 2}" y="${height - 2}" text-anchor="middle" font-size="7" fill="#666">${d.label.length > 6 ? d.label.slice(0, 6) : d.label}</text>
      <text x="${x + bw / 2}" y="${y - 3}" text-anchor="middle" font-size="8" fill="#333">${d.value}</text>`
  }).join("")
  return bars
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
    return `<rect x="${x}" y="${y}" width="24" height="${bh}" fill="rgba(59,130,246,0.3)" rx="2"/>`
  }).join("")
  const line = `<polyline points="${points}" fill="none" stroke="#3b82f6" stroke-width="2"/>`
  const dots = data.map((d, i) => {
    const x = i * step + step / 2
    const y = height - 15 - (d.value / max) * (height - 30)
    return `<circle cx="${x}" cy="${y}" r="3" fill="#3b82f6"/>`
  }).join("")
  return bars + line + dots
}

interface Props {
  apiType: "tpa" | "supervision"
}

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

  const colorDot = (checked: boolean) => checked ? "bg-primary" : "bg-muted border border-border"

  return (
    <Card className="mt-4">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics & Insights
            <span className="text-xs font-normal text-muted-foreground">— {apiType === "tpa" ? "TPA" : "Supervision"} performance data</span>
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShow(!show)}>
            {show ? "Hide" : "Show"} Charts
          </Button>
        </div>
      </CardHeader>
      {show && (
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-0.5">
              <Label className="text-[10px]">Period</Label>
              <select value={period} onChange={e => setPeriod(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2">
                <option value="all">All</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="semester">Semester</option>
              </select>
            </div>
            {period !== "all" && (
              <div className="space-y-0.5">
                <Label className="text-[10px]">{period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Semester"}</Label>
                <select value={month} onChange={e => setMonth(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2">
                  <option value="">Select...</option>
                  {period === "monthly" && Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                  {period === "quarterly" && [1, 2, 3, 4].map(q => (
                    <option key={q} value={q}>Q{q}</option>
                  ))}
                  {period === "semester" && [1, 2].map(s => (
                    <option key={s} value={s}>Sem {s}</option>
                  ))}
                </select>
              </div>
            )}
            {!isTeacher && (
              <div className="space-y-0.5">
                <Label className="text-[10px]">Grade</Label>
                <select value={grade} onChange={e => setGrade(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2">
                  <option value="">All</option>
                  {[7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>G{g}</option>)}
                </select>
              </div>
            )}
            {!isTeacher && (
              <div className="space-y-0.5">
                <Label className="text-[10px]">Teacher</Label>
                <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="h-7 text-xs rounded border border-input bg-background px-2">
                  <option value="">All</option>
                  {teachers.map((t: any) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            )}
            <Button size="sm" className="h-7 text-xs" onClick={fetchData} disabled={loading}>
              <TrendingUp className="mr-1 h-3 w-3" />Refresh
            </Button>
          </div>
          {isTeacher && <p className="text-[10px] text-muted-foreground">Showing your data only.</p>}

          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : !data ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Click Refresh to load analytics.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Score Ranges Pie */}
              {data.scoreRanges && (
                <div className="rounded-lg border p-3">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><PieChart className="h-3 w-3" />Score Distribution</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200" className="mx-auto"
                    dangerouslySetInnerHTML={{
                      __html: svgPie(Object.entries(data.scoreRanges).map(([k, v]) => ({ label: k, value: v as number })))
                        + `<g transform="translate(0,180)">`
                        + Object.entries(data.scoreRanges).map(([k, v], i) =>
                            `<text x="10" y="${i * 14 + 12}" font-size="9" fill="#666">${(['#3b82f6','#10b981','#f59e0b','#ef4444'])[i]} ${k}%: ${v}</text>`
                          ).join("")
                        + `</g>`
                    }}
                  />
                </div>
              )}

              {/* Grade Distribution */}
              {data.gradeDistribution?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <h4 className="text-xs font-semibold mb-2">Grade Distribution</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="160" viewBox="0 0 320 160"
                    dangerouslySetInnerHTML={{ __html: svgBar(data.gradeDistribution) }} />
                </div>
              )}

              {/* Monthly Trend */}
              {data.monthlyTrend?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <h4 className="text-xs font-semibold mb-2">Timeline</h4>
                  <svg xmlns="http://www.w3.org/2000/svg" width="400" height="140" viewBox="0 0 400 140"
                    dangerouslySetInnerHTML={{ __html: svgTimeline(data.monthlyTrend) }} />
                </div>
              )}

              {/* Status Distribution */}
              {data.statusDistribution?.length > 0 && (
                <div className="rounded-lg border p-3">
                  <h4 className="text-xs font-semibold mb-2">Status Distribution</h4>
                  <div className="space-y-1">
                    {data.statusDistribution.map((s: ChartData) => (
                      <div key={s.label} className="flex items-center gap-2 text-xs">
                        <span className="w-20 capitalize">{s.label}</span>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / Math.max(...data.statusDistribution.map((x: ChartData) => x.value), 1)) * 100}%` }} />
                        </div>
                        <span className="w-6 text-right">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Averages */}
              {data.teacherAverages?.length > 0 && (
                <div className="rounded-lg border p-3 sm:col-span-2 lg:col-span-3">
                  <h4 className="text-xs font-semibold mb-2">Teacher Average Scores</h4>
                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {data.teacherAverages.map((t: TeacherAvg) => (
                      <div key={t.teacher_id} className="flex items-center gap-2 text-xs rounded bg-muted/50 px-2 py-1.5">
                        <span className="flex-1 font-medium truncate">{t.teacher_name}</span>
                        <span className="text-muted-foreground">{t.count} assessment(s)</span>
                        <span className={`font-bold ${t.avg_score >= 80 ? 'text-green-600' : t.avg_score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {t.avg_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">{data ? `Total: ${data.total} record(s)` : ""}</p>
        </CardContent>
      )}
    </Card>
  )
}
