"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { SUBJECTS } from "@/lib/utils/constants"

interface SubjectTabsProps {
  value: string
  onChange: (code: string) => void
}

interface SubjectItem {
  code: string
  name: string
  icon: string
  is_active?: boolean
  sort_order?: number
}

export default function SubjectTabs({ value, onChange }: SubjectTabsProps) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(SUBJECTS as unknown as SubjectItem[])

  useEffect(() => {
    fetch("/api/subjects")
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) setSubjects(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={value === "all" ? "default" : "outline"}
        className="cursor-pointer text-xs px-3 py-1"
        onClick={() => onChange("all")}
      >
        All
      </Badge>
      {subjects.map((s) => (
        <Badge
          key={s.code}
          variant={value === s.code ? "default" : "outline"}
          className="cursor-pointer text-xs px-3 py-1"
          onClick={() => onChange(s.code)}
        >
          {s.icon} {s.code}
        </Badge>
      ))}
    </div>
  )
}
