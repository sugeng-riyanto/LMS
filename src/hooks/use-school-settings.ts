"use client"

import { useQuery } from "@tanstack/react-query"

interface SchoolSettings {
  school_name: string
  logo_url: string | null
  vp_name: string
  principal_name: string
  shs_vp_name: string
  shs_principal_name: string
  unit: string
  address: string | null
  phone: string | null
  email: string | null
  feature_visibility?: Record<string, boolean>
}

export function useSchoolSettings() {
  return useQuery({
    queryKey: ["school-settings"],
    queryFn: async (): Promise<SchoolSettings> => {
      const res = await fetch("/api/settings/school")
      if (!res.ok) throw new Error("Failed to fetch school settings")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}
