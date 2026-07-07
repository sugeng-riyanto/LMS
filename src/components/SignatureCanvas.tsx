"use client"

import { useRef, useState, useEffect, type MouseEvent, type TouchEvent } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, CheckCircle, Pen } from "lucide-react"

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  savedSig?: string | null
  label?: string
}

type CanvasSize = "S" | "M" | "L"
const CANVAS_DIMS: Record<CanvasSize, { w: number; h: number }> = {
  S: { w: 250, h: 70 },
  M: { w: 380, h: 110 },
  L: { w: 500, h: 150 },
}
const PEN_SIZES = [
  { label: "S", value: 2 },
  { label: "M", value: 5 },
  { label: "L", value: 8 },
]

export default function SignatureCanvas({ onSave, savedSig, label = "Signature" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(!!savedSig)
  const [penSize, setPenSize] = useState(3)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>("L")

  useEffect(() => {
    if (savedSig && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d")
        if (ctx) ctx.drawImage(img, 0, 0)
      }
      img.src = savedSig
    }
  }, [savedSig])

  function getPos(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDrawing(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
  }

  function draw(e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineWidth = penSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDrawing() {
    setIsDrawing(false)
    setHasContent(true)
  }

  function clear() {
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const dim = CANVAS_DIMS[canvasSize]
    ctx.clearRect(0, 0, dim.w, dim.h)
    setHasContent(false)
  }
  useEffect(() => {
    if (canvasRef.current) {
      const dim = CANVAS_DIMS[canvasSize]
      canvasRef.current.width = dim.w
      canvasRef.current.height = dim.h
    }
  }, [canvasSize])

  function save() {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL("image/png"))
    }
  }

  const dim = CANVAS_DIMS[canvasSize]

  return (
    <div className="space-y-3 flex flex-col items-center w-full mx-auto">
      <label className="text-size-sm font-semibold text-center">{label}</label>

      {/* Canvas size selector */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Area:</span>
        {(["S", "M", "L"] as CanvasSize[]).map(s => (
          <button key={s} type="button" onClick={() => setCanvasSize(s)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              canvasSize === s ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"
            }`}
          >{s}</button>
        ))}
        <span className="w-px h-4 bg-border mx-1" />
        <span className="text-[10px] text-muted-foreground">Pen:</span>
        {PEN_SIZES.map(ps => (
          <button key={ps.label} type="button" onClick={() => setPenSize(ps.value)}
            className={`px-2 py-1 rounded-md text-xs transition-all ${
              penSize === ps.value ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent"
            }`}
          >{ps.label}</button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={dim.w}
        height={dim.h}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="rounded-xl border-2 border-dashed border-input bg-white touch-none cursor-crosshair mx-auto shadow-sm"
        style={{ touchAction: "none", width: dim.w, height: dim.h, maxWidth: "100%" }}
      />

      <div className="flex gap-3 justify-center flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          <Eraser className="mr-1 h-4 w-4" />Clear
        </Button>
        <Button type="button" variant="default" size="sm" onClick={save}>
          <CheckCircle className="mr-1 h-4 w-4" />Save Signature
        </Button>
        {savedSig && (
          <span className="text-size-sm text-green-600 flex items-center">✓ Saved</span>
        )}
      </div>
    </div>
  )
}
