"use client"

import { useRef, useState, useEffect, type MouseEvent, type TouchEvent } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, CheckCircle } from "lucide-react"

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void
  savedSig?: string | null
  label?: string
}

export default function SignatureCanvas({ onSave, savedSig, label = "Signature" }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(!!savedSig)

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
    ctx.lineWidth = 2
    ctx.lineCap = "round"
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
    ctx.clearRect(0, 0, 300, 80)
    setHasContent(false)
  }

  function save() {
    if (canvasRef.current) {
      onSave(canvasRef.current.toDataURL("image/png"))
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <canvas
        ref={canvasRef}
        width={300}
        height={80}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full max-w-[300px] h-20 rounded-md border border-input bg-white touch-none cursor-crosshair"
        style={{ touchAction: "none" }}
      />
      <div className="flex gap-1">
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={clear}>
          <Eraser className="mr-1 h-3 w-3" />Clear
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={save}>
          <CheckCircle className="mr-1 h-3 w-3" />Save Sig
        </Button>
        {savedSig && (
          <span className="text-[10px] text-green-600 flex items-center">✓ Saved</span>
        )}
      </div>
    </div>
  )
}
