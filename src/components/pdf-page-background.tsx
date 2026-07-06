"use client"

import { useEffect, useRef, useState } from "react"

const pdfDocCache = new Map<string, any>()
let pdfjsLibPromise: Promise<any> | null = null
let pdfjsLoading = false
const pendingCallbacks: Array<(lib: any) => void> = []

function ensurePdfjsLib(): Promise<any> {
  if (pdfjsLibPromise) return pdfjsLibPromise
  if (typeof window !== "undefined" && (window as any).pdfjsLib) {
    const lib = (window as any).pdfjsLib
    lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js"
    pdfjsLibPromise = Promise.resolve(lib)
    return pdfjsLibPromise
  }
  if (!pdfjsLoading) {
    pdfjsLoading = true
    pdfjsLibPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "/pdfjs/pdf.min.js"
      script.onload = () => {
        const lib = (window as any).pdfjsLib
        if (!lib) { reject(new Error("pdfjsLib not found after script load")); return }
        lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js"
        resolve(lib)
        pendingCallbacks.forEach(cb => cb(lib))
        pendingCallbacks.length = 0
      }
      script.onerror = () => {
        const err = new Error("Failed to load /pdfjs/pdf.min.js")
        reject(err)
        pendingCallbacks.forEach(cb => cb(null))
        pendingCallbacks.length = 0
      }
      document.head.appendChild(script)
    })
  } else {
    pdfjsLibPromise = new Promise(resolve => {
      pendingCallbacks.push(resolve)
    })
  }
  return pdfjsLibPromise
}

export function PDFPageBackground({
  pdfUrl,
  pageNum,
}: {
  pdfUrl: string
  pageNum: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const renderKey = `${pdfUrl}-p${pageNum}`

  useEffect(() => {
    setReady(false)
    setError("")
    let cancelled = false

    async function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      try {
        const pdfjsLib = await ensurePdfjsLib()
        if (cancelled || !pdfjsLib) return

        const pdf = pdfDocCache.get(pdfUrl) || await pdfjsLib.getDocument({ url: pdfUrl, disableRange: true, disableStream: true, disableAutoFetch: true, useSystemFonts: true }).promise
        if (cancelled) return
        if (!pdfDocCache.has(pdfUrl)) pdfDocCache.set(pdfUrl, pdf)

        const page = await pdf.getPage(pageNum)
        if (cancelled) return

        const vp = page.getViewport({ scale: 1.35 })
        canvas.width = vp.width
        canvas.height = vp.height

        const ctx = canvas.getContext("2d")!
        await page.render({ canvasContext: ctx, viewport: vp }).promise
        if (!cancelled) setReady(true)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "PDF render failed")
      }
    }
    render()
    return () => { cancelled = true }
  }, [renderKey])

  if (error) {
    return <div className="absolute inset-0 flex items-start justify-end p-1 text-[9px] text-muted-foreground/50 pointer-events-none">PDF unavailable</div>
  }
  if (!ready) {
    return null
  }
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ objectFit: "contain" }}
    />
  )
}
