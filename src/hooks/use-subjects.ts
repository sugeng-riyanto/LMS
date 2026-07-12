"use client"

import { useState, useEffect } from "react"

export interface Subject {
  code: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}

const FALLBACK_SUBJECTS: Subject[] = [
  { code: "PHY", name: "Physics", icon: "⚛️", sort_order: 1, is_active: true },
  { code: "MAT", name: "Mathematics", icon: "📐", sort_order: 2, is_active: true },
  { code: "CHE", name: "Chemistry", icon: "🧪", sort_order: 3, is_active: true },
  { code: "BIO", name: "Biology", icon: "🧬", sort_order: 4, is_active: true },
  { code: "ECO", name: "Economics", icon: "📊", sort_order: 5, is_active: true },
]

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/subjects")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.length > 0) setSubjects(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { subjects, loading, refetch: () => fetch("/api/subjects").then(r => r.json()).then(setSubjects).catch(() => {}) }
}
