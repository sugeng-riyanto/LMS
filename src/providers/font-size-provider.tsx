"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type FontSize = "normal" | "medium" | "large"

interface FontSizeContextType {
  fontSize: FontSize
  setFontSize: (size: FontSize) => void
}

const FontSizeContext = createContext<FontSizeContextType>({
  fontSize: "normal",
  setFontSize: () => {},
})

export function useFontSize() {
  return useContext(FontSizeContext)
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<FontSize>("normal")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("shb-font-size") as FontSize | null
    if (saved && ["normal", "medium", "large"].includes(saved)) {
      setFontSize(saved)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem("shb-font-size", fontSize)
    // Remove all size classes
    document.documentElement.classList.remove("font-size-medium", "font-size-large")
    if (fontSize !== "normal") {
      document.documentElement.classList.add(`font-size-${fontSize}`)
    }
  }, [fontSize, mounted])

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  )
}
