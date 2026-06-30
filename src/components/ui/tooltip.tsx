"use client"

import * as React from "react"
import { cn } from "@/lib/utils/cn"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
}

function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <div className="group relative inline-flex">
      {children}
      <div
        className={cn(
          "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100",
          className
        )}
      >
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  )
}

export { Tooltip }
