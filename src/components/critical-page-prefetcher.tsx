'use client'

import { useEffect } from "react"
import { useAuth } from "@/providers/auth-provider"

const CRITICAL_PAGES = [
  "/dashboard",
  "/my-work",
  "/my-progress",
  "/my-week",
  "/calendar",
]

export function CriticalPagePrefetcher() {
  const { user, profile } = useAuth()

  useEffect(() => {
    if (!user || !profile) return

    const isStudent = profile.role === "student"
    const pages = isStudent
      ? ["/dashboard", "/my-work", "/my-progress", "/my-week", "/calendar"]
      : ["/dashboard", "/grading", "/syllabus", "/worksheets", "/analytics", "/calendar"]

    const controller = new AbortController()

    pages.forEach((page) => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => {
          const link = document.createElement("link")
          link.rel = "prefetch"
          link.href = page
          document.head.appendChild(link)
        }, { timeout: 2000 })
      }
    })

    return () => controller.abort()
  }, [user?.id, profile?.role])

  return null
}