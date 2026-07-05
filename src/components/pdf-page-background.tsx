"use client"

import { useEffect, useRef } from "react"

const pdfDocCache = new Map<string, any>()
let pdfjsLibPromise: Promise<any> | null = null

function ensurePdfjsLib(): Promise<any> {
  if (pdfjsLibPromise) return pdfjsLibPromise
  pdfjsLibPromise = new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib)
      return
    }
    const script = document.createElement("script")
    script.src = "/pdfjs/pdf.js"
    script.onload = () => {
      const lib = (window as any).pdfjsLib
      lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.js"
      resolve(lib)
    }
    script.onerror = () => reject(new Error("Failed to load pdf.js"))
    document.head.appendChild(script)
  })
  return pdfjsLibPromise
}

async function getPdfDoc(pdfUrl: string) {
  if (pdfDocCache.has(pdfUrl)) return pdfDocCache.get(pdfUrl)
  const pdfjsLib = await ensurePdfjsLib()
  const pdf = await pdfjsLib.getDocument(pdfUrl).promise
  pdfDocCache.set(pdfUrl, pdf)
  return pdf
}

export function PDFPageBackground({
  pdfUrl,
  pageNum,
  studentCanvasData,
  aspectRatio,
}: {
  pdfUrl: string
  pageNum: number
  studentCanvasData?: string | null
  aspectRatio: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderKey = `${pdfUrl}-p${pageNum}-${studentCanvasData?.slice(-20)}`

  useEffect(() => {
    let cancelled = false

    async function render() {
      const canvas = canvasRef.current
      if (!canvas || cancelled) return

      try {
        const pdf = await getPdfDoc(pdfUrl)
        if (cancelled) return

        const page = await pdf.getPage(pageNum)
        if (cancelled) return

        const vp = page.getViewport({ scale: 1 })
        const w = 800
        const h = Math.round(w / aspectRatio)
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext("2d")!
        const scale = w / vp.width
        await page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale }),
        }).promise
        if (cancelled) return

        if (studentCanvasData) {
          const img = new Image()
          await new Promise<void>((resolve) => {
            img.onload = () => { ctx.drawImage(img, 0, 0, w, h); resolve() }
            img.onerror = () => resolve()
            img.src = studentCanvasData
          })
        }
      } catch (e) {
        console.warn("PDF render error page", pageNum, e)
      }
    }

    render()
    return () => { cancelled = true }
  }, [renderKey])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ objectFit: "contain" }}
    />
  )
}
