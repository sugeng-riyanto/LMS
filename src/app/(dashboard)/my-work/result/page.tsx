"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      <ResultContent />
    </Suspense>
  )
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useAuth()
  const sourceType = searchParams.get("sourceType") || "worksheet"
  const sourceId = searchParams.get("sourceId") || ""

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceTitle, setSourceTitle] = useState("")
  const [teacherAnnoData, setTeacherAnnoData] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!sourceId || !profile?.id) return
    const status = sourceType === "worksheet" ? "worksheet_id" : "syllabus_id"
    fetch(`/api/student-work?${status}=${sourceId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const all = Array.isArray(data) ? data : []
        const mine = all.filter((s: any) => s.student_id === profile.id)
        setItems(mine)
        if (mine.length > 0) {
          if (sourceType === "worksheet") {
            fetch(`/api/worksheets/${sourceId}`).then(r => r.json()).then(d => setSourceTitle(d.title || "Worksheet")).catch(() => {})
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sourceId, profile?.id])

  useEffect(() => {
    const map: Record<string, string> = {}
    items.forEach((item: any) => {
      if (item.teacher_annotation) map[item.id] = item.teacher_annotation
    })
    setTeacherAnnoData(map)
  }, [items])

  const totalScore = items.reduce((s, i) => s + (i.score || 0), 0)
  const totalMax = items.reduce((s, i) => s + (i.max_score || 10), 0)

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-bold text-sm">{sourceTitle || "Assignment"}</h2>
            <p className="text-[11px] text-muted-foreground">{items.length} page(s) · Score {totalScore.toFixed(1)}/{totalMax.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-10">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No graded work found.</div>
        ) : items.map((item: any, idx: number) => {
          const hasCanvas = !!item.canvas_data
          const hasText = !!item.answer_text
          const hasTeacherAnno = !!teacherAnnoData[item.id]
          return (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center gap-3 border-b pb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary shrink-0">{idx + 1}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">
                    {hasCanvas ? "Drawing" : ""}{hasCanvas && hasText ? " + " : ""}{hasText ? "Written Answer" : ""}
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px]">Score: {item.score ?? "—"}/{item.max_score || 10}</Badge>
              </div>

              <div className="bg-gray-50 rounded-lg border overflow-hidden">
                {hasCanvas && (
                  <div className="relative" style={{ aspectRatio: "800/500", maxHeight: 500 }}>
                    <img src={item.canvas_data} alt="Your work" className="absolute inset-0 w-full h-full object-contain" />
                    {hasTeacherAnno && (
                      <img src={teacherAnnoData[item.id]} alt="Teacher annotation"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ opacity: 0.7 }} />
                    )}
                  </div>
                )}
                {hasText && (
                  <div className={hasCanvas ? "border-t" : ""}>
                    <pre className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed min-h-[60px]">{item.answer_text}</pre>
                  </div>
                )}
              </div>

              {item.feedback && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Feedback</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{item.feedback}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
