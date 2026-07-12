"use client"

import { useState, useEffect, useCallback } from "react"

export interface AssessmentWeight {
  id: string
  grade: number
  category: string
  weight: number
  updated_at: string
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  classwork: 0.4, unit_test: 0.2, project: 0.1, homework: 0.1, mid_semester: 0.1, final_semester: 0.1,
}

export function useAssessmentWeights(grade?: number) {
  const [weights, setWeights] = useState<AssessmentWeight[]>([])
  const [weightMap, setWeightMap] = useState<Record<string, number>>(DEFAULT_WEIGHTS)
  const [loading, setLoading] = useState(true)

  const fetchWeights = useCallback(async () => {
    try {
      const params = grade ? `?grade=${grade}` : ""
      const res = await fetch(`/api/assessment-weights${params}`)
      if (res.ok) {
        const data = await res.json()
        setWeights(data)
        if (data.length > 0) {
          const map: Record<string, number> = {}
          for (const item of data) {
            map[item.category] = item.weight
          }
          setWeightMap(map)
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [grade])

  useEffect(() => { fetchWeights() }, [fetchWeights])

  return { weights, weightMap, loading, refetch: fetchWeights }
}
