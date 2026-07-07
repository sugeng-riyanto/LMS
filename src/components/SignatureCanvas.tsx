"use client"

import { useRef, useState, useEffect, type MouseEvent, type TouchEvent } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, CheckCircle, Pen } from "lucide-react"

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  savedSig?: string | null
  label?: string
}

const PEN_SIZES = [
  { label: "S", value: 2, className: "h-3 w-3 rounded-full bg-foreground" },
  { label: "M", value: 5, className: "h-4 w-4 rounded-full bg-foreground" },
  { label: "L", value: 8, className: "h-5 w-5 rounded-full bg-foreground" },
]

export default function SignatureCanvas({ onSave, savedSig, label = "Signature" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(!!savedSig)
  const [penSize, setPenSize] = useState(3)

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
    ctx.clearRect(0, 0, 500, 150)
    setHasContent(false)
  }

  function save() {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL("image/png"))
    }
  }

  return (
    <div className="space-y-3 flex flex-col items-center w-full max-w-lg mx-auto">
      <label className="text-size-sm font-semibold text-center">{label}</label>

      {/* Pen size selector */}
      <div className="flex items-center gap-2">
        <Pen className="h-4 w-4 text-muted-foreground" />
        {PEN_SIZES.map(ps => (
          <button
            key={ps.label}
            type="button"
            onClick={() => setPenSize(ps.value)}
            className={`flex items-center gap-1 px-3 py-1 rounded-md border text-xs transition-all ${
              penSize === ps.value
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-input hover:bg-accent"
            }`}
          >
            <span className={ps.className} />
            {ps.label}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={500}
        height={150}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full max-w-[500px] h-[150px] rounded-xl border-2 border-dashed border-input bg-white touch-none cursor-crosshair mx-auto shadow-sm"
        style={{ touchAction: "none" }}
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
