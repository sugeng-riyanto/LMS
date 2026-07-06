"use client"

import { useFontSize } from "@/providers/font-size-provider"
import { Type } from "lucide-react"

const SIZES = [
  { value: "normal" as const, label: "A", title: "Normal" },
  { value: "medium" as const, label: "A", title: "Medium", className: "text-base" },
  { value: "large" as const, label: "A", title: "Large", className: "text-lg" },
]

export default function FontSizeToggle() {
  const { fontSize, setFontSize } = useFontSize()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
      <Type className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
      {SIZES.map((s) => (
        <button
          key={s.value}
          onClick={() => setFontSize(s.value)}
          title={s.title}
          className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium transition-all ${
            fontSize === s.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          } ${s.className || ""}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}
