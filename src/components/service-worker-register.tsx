'use client'

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && location.hostname !== "localhost") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration silently fails in some browsers
      })
    }
  }, [])

  return null
}