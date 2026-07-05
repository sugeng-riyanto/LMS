"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download } from "lucide-react"
import { PDFPageBackground } from "@/components/pdf-page-background"

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
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [teacherAnnoData, setTeacherAnnoData] = useState<Record<string, string>>({})
  const contentRef = useRef<HTMLDivElement>(null)

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
            fetch(`/api/worksheets/${sourceId}`).then(r => r.json()).then(d => {
              setSourceTitle(d.title || "Worksheet")
              if (Array.isArray(d.page_images)) setPageImages(d.page_images)
              if (d.pdf_url) setPdfUrl(d.pdf_url)
            }).catch(() => {})
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

  useEffect(() => {
    const beforePrint = () => {
      contentRef.current?.querySelectorAll<HTMLElement>('[data-print-group]').forEach(group => {
        const layers = group.querySelectorAll<HTMLImageElement>('[data-print-layer]')
        if (!layers.length) return
        const canvas = document.createElement('canvas')
        const w = group.offsetWidth
        const h = group.offsetHeight
        if (!w || !h) return
        canvas.width = w * 2
        canvas.height = h * 2
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.scale(2, 2)
        layers.forEach(img => {
          try { ctx.drawImage(img, 0, 0, w, h) } catch {}
        })
        const composite = document.createElement('img')
        composite.src = canvas.toDataURL('image/jpeg', 0.92)
        composite.style.cssText = 'display:block;width:100%'
        composite.dataset.printTemp = 'true'
        layers.forEach(l => { l.style.display = 'none' })
        group.appendChild(composite)
      })
    }
    const afterPrint = () => {
      document.querySelectorAll<HTMLElement>('[data-print-temp]').forEach(el => el.remove())
      document.querySelectorAll<HTMLImageElement>('[data-print-layer]').forEach(el => { el.style.display = '' })
    }
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
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
          <div className="flex-1">
            <h2 className="font-bold text-sm">{sourceTitle || "Assignment"}</h2>
            <p className="text-[11px] text-muted-foreground">{items.length} page(s) · Score {totalScore.toFixed(1)}/{totalMax.toFixed(0)}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5">
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <div ref={contentRef} className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-10">
        {items.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No graded work found.</div>
        ) : items.map((item: any, idx: number) => {
          const hasCanvas = !!item.canvas_data
          const hasText = !!item.answer_text
          const hasTeacherAnno = !!teacherAnnoData[item.id]
          const pageIdx = item.question_id ? parseInt(item.question_id.replace("page-", "")) - 1 : -1
          const bgImage = pageImages[pageIdx] || null
          return (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center gap-3 border-b pb-2 no-print">
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
                  <div className="relative" data-print-group>
                    {/* PDF background layer */}
                    {bgImage ? (
                      <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-contain" style={{ zIndex: 0 }} data-print-layer />
                    ) : pdfUrl ? (
                      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                        <PDFPageBackground pdfUrl={pdfUrl} pageNum={pageIdx + 1} />
                      </div>
                    ) : null}
                    {/* Student work */}
                    <img src={item.canvas_data} alt="Your work" className="w-full max-h-[90vh] object-contain relative" style={{ zIndex: 10 }} data-print-layer />
                    {/* Teacher annotation */}
                    {hasTeacherAnno && (
                      <img src={teacherAnnoData[item.id]} alt="Teacher annotation"
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        style={{ zIndex: 15, opacity: 0.7 }} data-print-layer />
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
