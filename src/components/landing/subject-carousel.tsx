"use client"

import { useState, useEffect } from "react"

interface Subject {
  code: string
  name: string
  icon: string
}

const FALLBACK_SUBJECTS: Subject[] = [
  { code: "PHY", name: "Physics", icon: "⚛️" },
  { code: "MAT", name: "Mathematics", icon: "📐" },
  { code: "CHE", name: "Chemistry", icon: "🧪" },
  { code: "BIO", name: "Biology", icon: "🧬" },
  { code: "ECO", name: "Economics", icon: "📊" },
]

export default function SubjectCarousel() {
  const [subjects, setSubjects] = useState<Subject[]>(FALLBACK_SUBJECTS)

  useEffect(() => {
    fetch("/api/subjects")
      .then(r => r.json())
      .then((data: Subject[]) => {
        if (Array.isArray(data) && data.length > 0) setSubjects(data)
      })
      .catch(() => {})
  }, [])

  const items = [...subjects, ...subjects, ...subjects]

  return (
    <div className="group/carousel w-full overflow-hidden">
      <div
        className="flex gap-4"
        style={{
          animation: "scroll-left 40s linear infinite",
          animationPlayState: "running",
          width: "max-content",
        }}
      >
        {items.map((s, i) => (
          <div
            key={`${s.code}-${i}`}
            className="flex w-36 shrink-0 flex-col items-center rounded-xl border border-border bg-card/70 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md hover:bg-card"
          >
            <div className="text-3xl transition-transform duration-300 hover:scale-125">{s.icon}</div>
            <p className="mt-2 font-semibold text-card-foreground text-sm transition-colors duration-300 hover:text-primary">{s.name}</p>
            <p className="text-xs text-muted-foreground">{s.code}</p>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .group\\/carousel:hover > div {
          animation-play-state: paused !important;
        }
      `}</style>
    </div>
  )
}
