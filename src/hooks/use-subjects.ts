"use client"

import { useState, useEffect } from "react"

export interface Subject {
  code: string
  name: string
  icon: string
  sort_order: number
  is_active: boolean
}

export const FALLBACK_SUBJECTS: Subject[] = [
  { code: "PHY", name: "Physics", icon: "⚛️", sort_order: 1, is_active: true },
  { code: "MAT", name: "Mathematics", icon: "📐", sort_order: 2, is_active: true },
  { code: "CHE", name: "Chemistry", icon: "🧪", sort_order: 3, is_active: true },
  { code: "BIO", name: "Biology", icon: "🧬", sort_order: 4, is_active: true },
  { code: "ECO", name: "Economics", icon: "📊", sort_order: 5, is_active: true },
]

let cachedSubjects: Subject[] | null = null
let cachePromise: Promise<Subject[]> | null = null

async function fetchSubjectsOnce(): Promise<Subject[]> {
  if (cachedSubjects) return cachedSubjects
  if (cachePromise) return cachePromise
  cachePromise = fetch("/api/subjects")
    .then(r => r.ok ? r.json() : [])
    .then(data => {
      cachedSubjects = (data.length > 0 ? data : FALLBACK_SUBJECTS)
      return cachedSubjects!
    })
    .catch(() => {
      cachedSubjects = FALLBACK_SUBJECTS
      return FALLBACK_SUBJECTS
    })
  return cachePromise
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubjectsOnce().then(data => {
      setSubjects(data)
      setLoading(false)
    })
  }, [])

  return { subjects, loading, refetch: () => { cachedSubjects = null; cachePromise = null; return fetchSubjectsOnce().then(setSubjects) } }
}

export function useSubjectsForTeacher(teacherSubjects: string[]) {
  const { subjects, loading, refetch } = useSubjects()
  const available = teacherSubjects.length === 0
    ? subjects
    : subjects.filter(s => teacherSubjects.includes(s.code))
  return { subjects: available, loading, refetch }
}
