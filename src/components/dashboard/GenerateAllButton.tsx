"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

interface GenerateAllButtonProps {
  onGenerate: () => void
  loading?: boolean
}

export default function GenerateAllButton({ onGenerate, loading }: GenerateAllButtonProps) {
  return (
    <Button
      size="lg"
      className="gap-2"
      onClick={onGenerate}
      disabled={loading}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
      Generate All Weekly Packages
    </Button>
  )
}
