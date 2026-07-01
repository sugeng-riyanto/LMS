"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, BookOpen, BrainCircuit, CalendarDays, Lightbulb, Save, Plus, Trash2, FileDown, FileText, FileType, Wand2, Printer, Video, Link as LinkIcon, Music, File, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GRADES } from "@/lib/utils/constants"
import { getCurrentWeek } from "@/lib/utils/week-calculator"
import { generateSyllabusMD as generateSyllabusExport } from "@/lib/export"
import toast from "react-hot-toast"

interface SyllabusTopic {
  id: string
  grade: number
  unit_id: string
  topic: string
  subtopics: string[]
  syllabus_ref: string
  curriculum: string
  suggested_weeks: number[]
}

interface CalendarEvent {
  id: string
  week_number: number
  event_name: string
  event_type: string
  affected_grades: number[]
  start_date: string
  end_date: string
  is_holiday: boolean
  effective_days: number | null
}

interface SyllabusPlan {
  id?: string
  grade: number
  week_number: number
  topic: string
  subtopics: string[]
  opening_ideas: string
  activity_questions: { question: string; bloom?: string; timing?: string }[]
  problems: { problem: string; level?: string }[]
  calendar_status: string
  effective_days: number
  status: string
}

const FlippedPhases = [
  { phase: "Entry Ticket & Hook", minutes: 5, icon: "🎯" },
  { phase: "Productive Struggle", minutes: 20, icon: "💪" },
  { phase: "CER Challenge", minutes: 10, icon: "🔬" },
  { phase: "Wrap-up & Mistake Journal", minutes: 5, icon: "📝" },
]

const defaultPlan: SyllabusPlan = {
  grade: 10,
  week_number: 1,
  topic: "",
  subtopics: [],
  opening_ideas: "",
  activity_questions: [],
  problems: [],
  calendar_status: "normal",
  effective_days: 5,
  status: "draft",
}

export default function SyllabusPlannerPage() {
  const router = useRouter()
  const supabase = createClient()

  const [generating, setGenerating] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number>(10)
  const [selectedWeek, setSelectedWeek] = useState<number>(getCurrentWeek())
  const [topics, setTopics] = useState<SyllabusTopic[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [objectives, setObjectives] = useState<Array<{ id: string; topic: string; objectives: string[] }>>([])
  const [plan, setPlan] = useState<SyllabusPlan>(defaultPlan)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [mediaSources, setMediaSources] = useState<Array<{ section: string; type: string; title: string; url: string }>>([])
  const [showMediaForm, setShowMediaForm] = useState<string | null>(null)
  const [mediaForm, setMediaForm] = useState({ section: "opening", type: "youtube", title: "", url: "" })
  const [editingMedia, setEditingMedia] = useState<{ section: string; index: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [topicsRes, eventsRes, planRes] = await Promise.all([
        supabase.from("syllabus_topics").select("*").eq("grade", selectedGrade).order("unit_id"),
        supabase.from("academic_calendars").select("*").contains("affected_grades", [selectedGrade]).eq("week_number", selectedWeek).order("start_date"),
        supabase.from("syllabus_planning").select("*").eq("grade", selectedGrade).eq("week_number", selectedWeek).maybeSingle(),
      ])

      if (topicsRes.data) setTopics(topicsRes.data as SyllabusTopic[])
      if (eventsRes.data) setEvents(eventsRes.data as CalendarEvent[])
      // Load objectives
      try {
        const objRes = await fetch(`/api/syllabus/objectives?grade=${selectedGrade}`)
        if (objRes.ok) { const objData = await objRes.json(); if (Array.isArray(objData)) setObjectives(objData) }
      } catch {}
      if (planRes.data) {
        const p = planRes.data as Record<string, unknown>
        setPlan({
          id: p.id as string,
          grade: p.grade as number,
          week_number: p.week_number as number,
          topic: (p.topic as string) ?? "",
          subtopics: (p.subtopics as string[]) ?? [],
          opening_ideas: (p.opening_ideas as string) ?? "",
          activity_questions: (p.activity_questions as Array<{ question: string; bloom?: string; timing?: string }>) ?? [],
          problems: (p.problems as Array<{ problem: string; level?: string }>) ?? [],
          calendar_status: (p.calendar_status as string) ?? "normal",
          effective_days: (p.effective_days as number) ?? 5,
          status: (p.status as string) ?? "draft",
        })
        setSelectedTopicIds(new Set(p.subtopics as string[] ?? []))
        // Load media sources from saved plan
        const media = p.media_links as Array<{ section: string; type: string; title: string; url: string }> | undefined
        if (media && Array.isArray(media) && media.length > 0) {
          setMediaSources(media)
        }
      } else {
        setPlan({ ...defaultPlan, grade: selectedGrade, week_number: selectedWeek })
        setSelectedTopicIds(new Set())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedGrade, selectedWeek])

  useEffect(() => { fetchData() }, [fetchData])

  const toggleTopic = (unitId: string) => {
    const next = new Set(selectedTopicIds)
    if (next.has(unitId)) next.delete(unitId)
    else next.add(unitId)
    setSelectedTopicIds(next)

    const selected = topics.filter(t => next.has(t.unit_id))
    setPlan(prev => ({
      ...prev,
      topic: selected.map(t => t.topic).join(" + "),
      subtopics: Array.from(next),
    }))
  }

  // Auto-generate content when topic selection changes
  useEffect(() => {
    if (!plan.topic || topics.length === 0) return

    const selectedTopics = topics.filter(t => selectedTopicIds.has(t.unit_id))
    const topicNames = selectedTopics.map(t => t.topic)
    const topicLower = topicNames.join(" ").toLowerCase()

    const hooks: Record<string, string> = {
      kinematics: "Why do astronauts float in space when gravity is still 90% as strong as on Earth? Let's investigate the physics of motion!",
      forces: "How does a 400-tonne aeroplane stay in the air? Uncover the fundamental forces that govern our universe.",
      energy: "Can energy ever truly be created or destroyed? Explore the universal principle that shapes all physical phenomena.",
      waves: "How can whales communicate across hundreds of kilometres of ocean? Discover the physics of wave propagation.",
      electricity: "What really happens when you flip a light switch? Trace the journey of electrical energy from power station to bulb.",
      magnetism: "Could we build a train that levitates? Explore the invisible forces of electromagnetism.",
      thermal: "Why does a metal spoon feel colder than a wooden one at the same temperature? Investigate thermal physics.",
      density: "How can a massive steel ship float while a tiny nail sinks? The answer lies in density.",
      pressure: "Why do your ears pop during takeoff? Explore the fascinating physics of pressure.",
      nuclear: "How can a tiny atom release enough energy to power a city? Explore the incredible physics of the atomic nucleus.",
      radioactivity: "How do scientists date ancient artefacts using invisible radiation? Discover the principles of radioactivity.",
      space: "How do we know the universe is expanding? Embark on a journey through space physics and cosmology.",
      "past paper": "Master your exam technique with targeted past paper practice. Identify weak areas and build confidence.",
      circuit: "What happens to current when you add a second bulb to a series circuit? Investigate the laws of electrical circuits.",
      electromagnet: "How can electricity create a magnet? Explore the relationship between current and magnetic fields.",
    }

    // Collect ALL matching hooks (one per matched topic)
    const matchedHooks: string[] = []
    for (const [k, v] of Object.entries(hooks)) {
      if (topicLower.includes(k)) matchedHooks.push(v)
    }
    const openingText = matchedHooks.length > 0
      ? matchedHooks.join("\n\nAlternatively, consider this:\n")
      : `Why do ${topicNames.slice(0, 3).join(", ")} matter in our everyday lives? Let us investigate through scientific inquiry.`

    // Generate questions for EACH selected topic
    const questions = topicNames.length > 1
      ? topicNames.flatMap((t) => [
          { question: `What fundamental principles govern ${t}?`, bloom: "remember" as const, timing: "10 min" },
          { question: `How can the concepts of ${t} be applied to solve practical problems?`, bloom: "apply" as const, timing: "15 min" },
          { question: `Evaluate a scenario involving ${t} and predict the outcome using physical laws.`, bloom: "evaluate" as const, timing: "15 min" },
        ])
      : [
          { question: `What fundamental principles govern ${topicNames[0] || plan.topic}?`, bloom: "remember" as const, timing: "10 min" },
          { question: `How can the concepts of ${topicNames[0] || plan.topic} be applied to solve practical problems?`, bloom: "apply" as const, timing: "20 min" },
          { question: `Evaluate a scenario involving ${topicNames[0] || plan.topic} and predict the outcome using physical laws.`, bloom: "evaluate" as const, timing: "10 min" },
        ]

    // Generate problems for EACH selected topic
    const problems = topicNames.length > 1
      ? topicNames.flatMap((t) => [
          { problem: `Define and explain the core principles of ${t} using appropriate terminology.`, level: "L1" as const },
          { problem: `Analyse the following case study related to ${t} and identify any conceptual errors in the reasoning.`, level: "L2" as const },
          { problem: `Design an experiment to test a hypothesis about ${t}. Include your Claim, Evidence, and Reasoning framework.`, level: "L3" as const },
        ])
      : [
          { problem: `Define and explain the core principles of ${topicNames[0] || plan.topic} using appropriate terminology.`, level: "L1" as const },
          { problem: `Analyse the following case study related to ${topicNames[0] || plan.topic} and identify any conceptual errors in the reasoning.`, level: "L2" as const },
          { problem: `Design an experiment to test a hypothesis about ${topicNames[0] || plan.topic}. Include your Claim, Evidence, and Reasoning framework.`, level: "L3" as const },
        ]

    setPlan(prev => ({
      ...prev,
      opening_ideas: openingText,
      activity_questions: questions,
      problems,
    }))
  }, [plan.topic, selectedTopicIds])

  const addQuestion = () => {
    setPlan(prev => ({
      ...prev,
      activity_questions: [...prev.activity_questions, { question: "", bloom: "analyze", timing: "20 min" }],
    }))
  }

  const updateQuestion = (i: number, field: string, value: string) => {
    setPlan(prev => {
      const qs = [...prev.activity_questions]
      qs[i] = { ...qs[i], [field]: value }
      return { ...prev, activity_questions: qs }
    })
  }

  const removeQuestion = (i: number) => {
    setPlan(prev => ({
      ...prev,
      activity_questions: prev.activity_questions.filter((_, idx) => idx !== i),
    }))
  }

  const addProblem = () => {
    setPlan(prev => ({
      ...prev,
      problems: [...prev.problems, { problem: "", level: "L2" }],
    }))
  }

  const updateProblem = (i: number, field: string, value: string) => {
    setPlan(prev => {
      const ps = [...prev.problems]
      ps[i] = { ...ps[i], [field]: value }
      return { ...prev, problems: ps }
    })
  }

  const removeProblem = (i: number) => {
    setPlan(prev => ({
      ...prev,
      problems: prev.problems.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSave(silent = false) {
    if (!plan.topic) {
      if (!silent) toast.error("Select at least one topic")
      return false
    }

    try {
      // Check if record exists
      const { data: existing } = await (supabase.from("syllabus_planning") as any)
        .select("id")
        .eq("academic_year", "2026-2027")
        .eq("grade", selectedGrade)
        .eq("week_number", selectedWeek)
        .maybeSingle()

      const payload = {
        grade: selectedGrade,
        week_number: selectedWeek,
        academic_year: "2026-2027",
        topic: plan.topic,
        subtopics: Array.from(selectedTopicIds),
        opening_ideas: plan.opening_ideas,
        activity_questions: plan.activity_questions,
        problems: plan.problems,
        calendar_status: (events ?? []).find(e => e.event_type !== "holiday")?.event_type ?? "normal",
        effective_days: (events ?? [])[0]?.effective_days ?? 5,
        status: "planned",
      }

      let error: any = null
      const savePayload = { ...payload, media_links: mediaSources }
      if (existing) {
        const { error: e } = await (supabase.from("syllabus_planning") as any).update(savePayload).eq("id", existing.id)
        error = e
      } else {
        const { error: e } = await (supabase.from("syllabus_planning") as any).insert(savePayload)
        error = e
      }

      if (error) { console.error("Save error:", JSON.stringify(error)); throw new Error(error.message || "Database error") }
      if (!silent) toast.success("Syllabus plan saved!")
      setPlan(prev => ({ ...prev, status: "planned" }))
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e) || "Unknown"
      if (!silent) toast.error("Failed to save: " + msg)
      return false
    }
  }

  async function handleGenerate() {
    if (!plan.topic) {
      toast.error("Select at least one topic first")
      return
    }

    setGenerating(true)

    if (!plan.opening_ideas && plan.activity_questions.length === 0 && plan.problems.length === 0) {
      try {
        const res = await fetch("/api/agents/generate-syllabus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grade: selectedGrade,
            week: selectedWeek,
            topic: plan.topic,
            subtopics: Array.from(selectedTopicIds),
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const suggestions = data.suggestions ?? data
          setPlan((prev) => ({
            ...prev,
            opening_ideas: suggestions.opening_ideas ?? prev.opening_ideas,
            activity_questions: suggestions.activity_questions?.length > 0 ? suggestions.activity_questions : prev.activity_questions,
            problems: suggestions.problems?.length > 0 ? suggestions.problems : prev.problems,
          }))
          toast.success("Syllabus content generated! Review and save.")
        } else {
          toast.success("No AI provider — generating package directly.")
        }
      } catch {
        toast.success("Generating package now...")
      }
    }

    try {
      const saved = await handleSave(true)
      if (!saved) {
        toast.error("Failed to save plan")
        setGenerating(false)
        return
      }

      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: selectedGrade }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }))
        toast.error(err.error ?? "Generation failed")
        setGenerating(false)
        return
      }

      toast.success("Package generated! Redirecting...")
      setTimeout(() => { router.push(`/grades/${selectedGrade}/${selectedWeek}`) }, 1500)
    } catch (e) {
      toast.error("Generate failed: " + (e instanceof Error ? e.message : "Unknown"))
      setGenerating(false)
    }
  }

  async function handleAIGenerate() {
    if (!plan.topic) { toast.error("Select at least one topic first"); return }
    setGeneratingAI(true)
    try {
      const res = await fetch("/api/agents/generate-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: selectedGrade, week: selectedWeek, topic: plan.topic, subtopics: Array.from(selectedTopicIds) }),
      })
      const data = await res.json()
      setPlan((prev) => ({
        ...prev,
        opening_ideas: data.opening_ideas ?? prev.opening_ideas,
        activity_questions: data.activity_questions?.length > 0 ? data.activity_questions : prev.activity_questions,
        problems: data.problems?.length > 0 ? data.problems : prev.problems,
      }))
      toast.success("AI content generated! Review before saving.")
    } catch { toast.error("AI generation failed") }
    finally { setGeneratingAI(false) }
  }

  function generateSyllabusMD(): string {
    const curriculum = topics.find(t => selectedTopicIds.has(t.unit_id))?.curriculum ?? "Cambridge"
    const refs = topics.filter(t => selectedTopicIds.has(t.unit_id)).map(t => t.syllabus_ref).filter(Boolean).join(", ")
    return generateSyllabusExport(
      selectedGrade, selectedWeek, plan.topic,
      plan.opening_ideas,
      plan.activity_questions.map(q => ({ ...q })),
      plan.problems.map(p => ({ ...p })),
      events.map(e => ({ event_name: e.event_name, event_type: e.event_type })),
      curriculum, refs,
    )
  }

  function addMediaSource() {
    if (!mediaForm.title || !mediaForm.url) { toast.error("Title and URL are required"); return }
    if (editingMedia) {
      setMediaSources(prev => {
        const sectionItems = prev.filter(s => s.section === editingMedia.section)
        const target = sectionItems[editingMedia.index]
        if (!target) return prev
        const globalIdx = prev.indexOf(target)
        const updated = [...prev]; updated[globalIdx] = { ...mediaForm }
        return updated
      })
      setEditingMedia(null)
      toast.success("Source updated!")
    } else {
      setMediaSources(prev => [...prev, { ...mediaForm }])
      toast.success("Source added!")
    }
    setMediaForm({ section: "opening", type: "youtube", title: "", url: "" })
    setShowMediaForm(null)
  }

  function mediaPreview(src: { type: string; url: string; title: string }) {
    const embedUrl = getEmbedUrl(src.url, src.type)
    if (src.type === "youtube" && embedUrl) {
      return <div className="mt-1 rounded-lg overflow-hidden border" style={{ aspectRatio: "16/9" }}><iframe src={embedUrl} className="w-full h-full" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture" allowFullScreen /></div>
    }
    if (src.type === "pdf" && embedUrl) {
      return <div className="mt-1 rounded-lg overflow-hidden border bg-gray-50" style={{ height: "400px" }}>
        <iframe src={embedUrl} className="w-full h-full" title={src.title} />
        <div className="text-center text-xs text-muted-foreground p-1 border-t bg-white">
          <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open PDF in new tab ↗</a> if preview doesn't load
        </div>
      </div>
    }
    if (src.type === "slides" && embedUrl) {
      return <div className="mt-1 rounded-lg overflow-hidden border" style={{ aspectRatio: "16/9" }}><iframe src={embedUrl} className="w-full h-full" allowFullScreen /></div>
    }
    if (src.type === "audio") {
      return <audio controls className="w-full mt-1"><source src={src.url} /></audio>
    }
    return null
  }

  function startEditSource(section: string, index: number) {
    const sectionItems = mediaSources.filter(s => s.section === section)
    const item = sectionItems[index]
    if (!item) return
    setMediaForm({ section: item.section, type: item.type, title: item.title, url: item.url })
    setEditingMedia({ section, index })
    setShowMediaForm(section)
  }

  function removeMediaSource(section: string, idx: number) {
    setMediaSources(prev => {
      const inSection = prev.filter(s => s.section === section)
      const target = inSection[idx]
      if (!target) return prev
      const globalIdx = prev.indexOf(target)
      return prev.filter((_, i) => i !== globalIdx)
    })
  }

  function getEmbedUrl(url: string, type: string): string | null {
    if (type === "youtube") {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/)
      return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : null
    }
    if (type === "pdf" || type === "slides") {
      const gDrive = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
      if (gDrive) {
        const fileId = gDrive[1]
        if (type === "slides") return `https://docs.google.com/presentation/d/${fileId}/embed`
        // PDF: use Google Docs Viewer (works on all domains including localhost)
        return `https://docs.google.com/viewer?url=https://drive.google.com/uc?export=download&id=${fileId}&embedded=true`
      }
      if (url.match(/\.pdf/i)) return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`
      return null
    }
    if (type === "audio") return url
    // Default: try to use as direct link
    return url || null
  }

  function esc(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") }

  function getShareHtml(overrideMedia?: typeof mediaSources): string {
    const activeMedia = overrideMedia || mediaSources
    const today = new Date()
    const dateStr = today.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    const dateCode = today.toISOString().split("T")[0].replace(/-/g, "")
    const hooks = plan.opening_ideas?.split("\n").filter(Boolean) || []
    const questions = plan.activity_questions || []
    const problems = plan.problems || []
    const openingSources = activeMedia.filter(s => s.section === "opening")
    const questionSources = activeMedia.filter(s => s.section === "questions")
    const allQs = [...hooks.map(h => ({ text: h, section: "opening" })), ...questions.map(q => ({ text: q.question, section: "question" })), ...problems.map(p => ({ text: p.problem, section: "problem" }))]

    const selectedTopics = topics.filter(t => selectedTopicIds.has(t.unit_id))
    const allObjectives = (window as any).__SYLLABUS_OBJECTIVES__ || []
    const objectivesHtml = selectedTopics.length > 0
      ? `<div class="mb-6"><h2 class="text-lg font-semibold text-gray-800 mb-2">Learning Objectives</h2><div class="space-y-3">${selectedTopics.map(t => {
        const obj = Array.isArray(allObjectives) ? allObjectives.find((o: any) => o.topic.toLowerCase() === t.topic.toLowerCase()) : null
        const objectives = obj?.objectives || []
        return `<div class="border-l-4 border-green-500 pl-4"><p class="font-medium text-gray-800">${esc(t.topic)}</p><p class="text-xs text-gray-500 mb-1">${esc(t.syllabus_ref)} · ${esc(t.curriculum)}</p>${objectives.length ? `<ul class="space-y-0.5 mt-1">${objectives.map((o: string) => `<li class="text-xs text-gray-600 flex items-start gap-1.5"><span class="text-green-500 mt-0.5">•</span>${esc(o)}</li>`).join("")}</ul>` : `<div class="flex flex-wrap gap-1 mt-1">${t.subtopics.map((st: string) => `<span class="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">${esc(st)}</span>`).join("")}</div>`}</div>`
      }).join("")}</div></div>`
      : ""

    const origin = typeof window !== "undefined" ? window.location.origin : "https://yourdomain.com"
    const planId = plan.id || ""
    // QR code links to the public syllabus page (anyone can view, no login required)
    const publicUrl = planId ? `${origin}/syllabus/public/${planId}` : origin
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(publicUrl)}`

    // Student names from profiles (fetched on share)
    const gradeStudents = typeof window !== "undefined"
      ? (window as any).__SYLLABUS_STUDENTS__ || []
      : []
    const studentOptions = Array.isArray(gradeStudents) && gradeStudents.length
      ? gradeStudents.map((n: string) => `<option value="${esc(n)}">${esc(n)}</option>`).join("")
      : ["Ahmad Fauzi", "Bunga Lestari", "Citra Dewi", "Dimas Prayoga", "Eka Putri Sari", "Farhan Maulana"].map(n => `<option value="${n}">${n}</option>`).join("")

    // Render media sources — always show embed with click-to-load
    function renderSource(src: { url: string; type: string; title: string }) {
      const embedUrl = getEmbedUrl(src.url, src.type)
      const videoId = src.type === "youtube" ? (src.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/) || [])[1] : null

      // YouTube: thumbnail with click-to-play
      if (src.type === "youtube" && videoId) {
        const thumb = `https://img.youtube.com/vi/${videoId}/0.jpg`
        return `<div class="mt-3 rounded-lg overflow-hidden border bg-black relative" style="aspect-ratio:16/9">
          <div class="yt-player cursor-pointer relative w-full h-full" data-embed="${embedUrl || ""}">
            <img src="${thumb}" class="w-full h-full object-cover" alt="" loading="lazy" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-14 h-14 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/80"><span class="text-white text-2xl ml-1">&#9654;</span></div>
            </div>
          </div>
          <p class="text-xs text-gray-400 px-2 pb-1">${esc(src.title)}</p>
        </div>`
      }

      // PDF / Slides: click-to-preview
      if (src.type === "pdf" || src.type === "slides") {
        const isSlide = src.type === "slides"
        return `<div class="mt-3 rounded-lg overflow-hidden border">
          <div class="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <p class="text-sm font-medium truncate">${esc(src.title)}</p>
            <a href="${src.url}" target="_blank" class="text-xs text-blue-600 underline shrink-0 ml-2">Open ↗</a>
          </div>
          <div style="aspect-ratio:${isSlide ? '16/9' : '16/11'};max-height:500px">
            <div class="doc-preview cursor-pointer w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200" data-embed="${embedUrl || ""}" data-url="${esc(src.url)}">
              <span class="text-3xl mb-2">${isSlide ? '📽️' : '📄'}</span>
              <p class="text-sm font-medium">Click to preview</p>
              <p class="text-xs mt-1 text-center px-4">${esc(src.title)}</p>
            </div>
          </div>
        </div>`
      }

      // Audio
      if (src.type === "audio") return `<div class="mt-3"><audio controls class="w-full"><source src="${src.url}"></audio><p class="text-xs text-gray-400 mt-1">${esc(src.title)}</p></div>`

      // Default: link
      return `<div class="mt-2"><a href="${src.url}" target="_blank" class="text-blue-600 underline text-sm">${esc(src.title)}</a></div>`
    }

    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Syllabus - Grade ${selectedGrade} Week ${selectedWeek}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
body{font-family:'Segoe UI',system-ui,sans-serif;font-size:14px}
@media print{body{background:#fff;padding:0}.no-print{display:none!important}.print-break{page-break-before:always}canvas{border:1px solid #ccc!important}}
.q-item{border-left:4px solid #3b82f6;background:#f0f7ff;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:8px}
canvas{touch-action:none;cursor:crosshair;border-radius:8px;max-width:100%}
.signature-box{border:2px dashed #ccc;border-radius:12px;min-height:120px;cursor:crosshair}
@media(max-width:640px){body{padding:8px}}
</style>
</head>
<body class="bg-gray-50 text-gray-900 p-4 md:p-8 min-h-screen">
<div class="max-w-5xl mx-auto" id="syllabus-content">
<div class="bg-white rounded-2xl shadow-sm border p-6 md:p-10 space-y-8">
<div class="border-b pb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
<div>
<h1 class="text-2xl md:text-3xl font-bold text-gray-900">Syllabus Plan</h1>
<p class="text-gray-500 mt-1">Grade ${selectedGrade} · Week ${selectedWeek} · ${dateStr}</p>
<p class="text-gray-700 mt-2 font-medium text-lg">Topic: ${esc(plan.topic)}</p>
</div>
${plan.id ? `<div class="shrink-0 text-center"><img src="${qrUrl}" alt="QR" class="w-24 h-24 mx-auto rounded border" /><p class="text-[10px] text-gray-400 mt-1">Scan to view online</p></div>` : ""}
</div>

${objectivesHtml}

<!-- STUDENT INFO -->
<div class="bg-gray-50 rounded-xl p-4 md:p-6 space-y-4 border">
<h3 class="font-semibold text-gray-700">Student Information</h3>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div><label class="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
<select id="student-name" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
<option value="">Select student...</option>
${studentOptions}
</select></div>
<div><label class="block text-sm font-medium text-gray-600 mb-1">Date</label>
<input type="text" value="${dateCode}" readonly class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-100 text-gray-500" /></div>
</div>
</div>

<!-- ANSWER SECTIONS -->
<div class="space-y-8 mt-6">
${allQs.map((item, idx) => {
  const sectionLabel = item.section === "opening" ? "Opening Ideas" : item.section === "question" ? "Activity Question" : "Problem"
  const bgColor = item.section === "opening" ? "bg-blue-50" : item.section === "question" ? "bg-green-50" : "bg-purple-50"
  const srcList = item.section === "opening" ? openingSources : item.section === "question" ? questionSources : []
  return `
<div class="rounded-xl border p-5 space-y-4">
<div class="flex items-start gap-3">
<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bgColor} text-xs font-bold text-gray-700">${idx + 1}</div>
<div class="flex-1">
<p class="text-xs text-gray-500 mb-1">${sectionLabel}</p>
<p class="font-medium text-gray-800">${esc(item.text)}</p>
</div>
</div>
${srcList.map(s => renderSource(s)).join("")}
<div class="space-y-3">
<textarea id="ans-text-${idx}" rows="3" class="w-full rounded-lg border border-gray-300 p-3 text-sm resize-y" placeholder="Type your answer here (paste disabled)" onpaste="event.preventDefault();alert('Paste is disabled. Please type your answer manually.')" oncopy="event.preventDefault()" oncut="event.preventDefault()"></textarea>
<div class="flex flex-wrap items-center gap-1.5 mt-1 no-print">
<select class="tool-size text-xs border rounded px-1 py-0.5 bg-white" data-target="ans-canvas-${idx}">
<option value="2">Thin</option><option value="5" selected>Medium</option><option value="10">Thick</option><option value="20">Bold</option>
</select>
<button class="tool-pen px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="ans-canvas-${idx}" data-mode="pen">✏️ Pen</button>
<button class="tool-eraser px-2 py-0.5 text-xs rounded border bg-white hover:bg-gray-100" data-target="ans-canvas-${idx}" data-mode="eraser">🧹 Eraser</button>
<button class="tool-clear px-2 py-0.5 text-xs rounded border bg-red-100 hover:bg-red-200 text-red-700" data-target="ans-canvas-${idx}">🗑️ Clear</button>
<span class="text-xs text-gray-400 ml-1" id="mode-label-${idx}">✏️ Drawing</span>
</div>
<canvas id="ans-canvas-${idx}" width="700" height="300" class="w-full rounded-lg border"></canvas>
</div>
</div>`
}).join("")}
</div>

<!-- SIGNATURE -->
<div class="rounded-xl border-2 border-dashed border-gray-400 p-6 space-y-3 mt-8">
<h3 class="font-semibold text-gray-700">Signature</h3>
<p class="text-xs text-gray-500">Draw your signature below</p>
<canvas id="signature-canvas" width="700" height="150" class="w-full signature-box"></canvas>
<div class="flex gap-2 no-print">
<button onclick="clearCanvas('signature-canvas')" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100">Clear</button>
</div>
</div>

<div class="flex flex-wrap gap-3 pt-4 no-print">
<button onclick="printPDF()" class="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm">🖨️ Print / Save as PDF</button>
<button onclick="clearAll()" class="px-4 py-3 border rounded-xl font-medium hover:bg-gray-100">Clear All</button>
</div>

<div class="border-t pt-6 text-center text-sm text-gray-400">
<p>Generated by Physics Command Center - SHB Modernhill</p>
<p class="mt-1">${dateStr}</p>
</div>
</div>
</div>

<script>
// Canvas drawing utility
const canvases = {}
function initCanvas(id) {
  const c = document.getElementById(id)
  if (!c) return
  const ctx = c.getContext("2d")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.strokeStyle = "#1a1a2e"
  ctx.lineWidth = 2.5
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  let drawing = false, last = null
  function getPos(e) {
    const r = c.getBoundingClientRect()
    const sx = c.width / r.width, sy = c.height / r.height
    const t = e.touches ? e.touches[0] : e
    return { x: (t.clientX - r.left) * sx, y: (t.clientY - r.top) * sy }
  }
  function start(e) { e.preventDefault(); drawing = true; const p = getPos(e); last = p; ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  function move(e) { if (!drawing) return; e.preventDefault(); const p = getPos(e); if (last) { ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke() } last = p }
  function stop() { drawing = false; last = null }
  c.addEventListener("mousedown", start); c.addEventListener("mousemove", move); c.addEventListener("mouseup", stop); c.addEventListener("mouseleave", stop)
  c.addEventListener("touchstart", start, {passive:false}); c.addEventListener("touchmove", move, {passive:false}); c.addEventListener("touchend", stop)
  canvases[id] = c
}
function clearCanvas(id) {
  const c = document.getElementById(id)
  if (!c) return
  const ctx = c.getContext("2d")
  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, c.width, c.height)
}
function printPDF() {
  const name = document.getElementById("student-name")?.value || "Unnamed"
  document.title = "Syllabus-" + name.replace(/\\s+/g,"-") + "-${dateCode}"
  window.print()
}
function clearAll() {
  document.querySelectorAll("textarea").forEach(t => t.value = "")
  document.querySelectorAll("canvas").forEach(c => clearCanvas(c.id))
}
document.addEventListener("DOMContentLoaded", function() {
  // Canvas drawing with tools
  var canvasState = {}
  function initCanvas(id) {
    var c = document.getElementById(id); if (!c) return
    var ctx = c.getContext("2d")
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,c.width,c.height)
    canvasState[id] = { ctx: ctx, mode: "pen", size: 5, color: "#1a1a2e", drawing: false, last: null }
    function pos(e) {
      var r = c.getBoundingClientRect(), sx = c.width/r.width, sy = c.height/r.height
      var t = e.touches ? e.touches[0] : e
      return { x: (t.clientX-r.left)*sx, y: (t.clientY-r.top)*sy }
    }
    function start(e) { e.preventDefault(); var s = canvasState[id]; s.drawing = true; var p = pos(e); s.last = p; s.ctx.beginPath(); s.ctx.moveTo(p.x,p.y) }
    function move(e) { if (!canvasState[id].drawing) return; e.preventDefault(); var s = canvasState[id]; var p = pos(e); if (s.last) { s.ctx.beginPath(); s.ctx.moveTo(s.last.x,s.last.y); s.ctx.lineTo(p.x,p.y); s.ctx.stroke() } s.last = p }
    function stop() { canvasState[id].drawing = false; canvasState[id].last = null }
    c.addEventListener("mousedown",start); c.addEventListener("mousemove",move); c.addEventListener("mouseup",stop); c.addEventListener("mouseleave",stop)
    c.addEventListener("touchstart",start,{passive:false}); c.addEventListener("touchmove",move,{passive:false}); c.addEventListener("touchend",stop)
  }

  // Apply tool settings to canvas
  function applyTool(canvasId) {
    var s = canvasState[canvasId]; if (!s) return
    var sizeSel = document.querySelector('.tool-size[data-target="'+canvasId+'"]')
    var modeBtn = document.querySelector('.tool-pen[data-target="'+canvasId+'"], .tool-eraser[data-target="'+canvasId+'"]')
    var label = document.getElementById('mode-label-'+canvasId.replace('ans-canvas-',''))
    if (sizeSel) s.size = parseInt(sizeSel.value)
    s.ctx.lineWidth = s.size
    if (s.mode === "eraser") { s.ctx.strokeStyle = "#fff"; if (label) label.textContent = "🧹 Eraser" }
    else { s.ctx.strokeStyle = s.color; if (label) label.textContent = "✏️ Drawing" }
  }

  // Tool button events
  document.querySelectorAll(".tool-pen, .tool-eraser").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var target = this.dataset.target
      var mode = this.dataset.mode
      if (canvasState[target]) canvasState[target].mode = mode
      applyTool(target)
      // Toggle active state
      document.querySelectorAll('.tool-pen[data-target="'+target+'"], .tool-eraser[data-target="'+target+'"]').forEach(function(b) { b.style.background = "#fff"; b.style.borderColor = "#d1d5db" })
      this.style.background = "#dbeafe"; this.style.borderColor = "#3b82f6"
    })
  })

  // Size change
  document.querySelectorAll(".tool-size").forEach(function(sel) {
    sel.addEventListener("change", function() { applyTool(this.dataset.target) })
  })

  // Clear button
  document.querySelectorAll(".tool-clear").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var id = this.dataset.target
      var c = document.getElementById(id); if (!c) return
      c.getContext("2d").fillRect(0,0,c.width,c.height)
    })
  })

  // Init all canvases
  document.querySelectorAll("canvas[id^=ans-canvas], #signature-canvas").forEach(function(c) { initCanvas(c.id) })

  // YouTube click-to-play — replace placeholder with iframe
  document.querySelectorAll(".yt-player").forEach(function(el) {
    el.addEventListener("click", function() {
      var embed = this.dataset.embed
      if (embed) {
        this.innerHTML = '<iframe src="'+embed+'" class="absolute inset-0 w-full h-full" allow="accelerometer;autoplay;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen style="border:0"></iframe>'
        this.classList.remove('cursor-pointer')
      }
    })
  })

  // Document click-to-preview (PDF/Slides)
  document.querySelectorAll(".doc-preview").forEach(function(el) {
    el.addEventListener("click", function() {
      var embed = this.dataset.embed
      if (embed) {
        this.innerHTML = '<iframe src="'+embed+'" class="w-full h-full" allowfullscreen style="border:0"></iframe>'
        this.className = 'w-full h-full'
      }
    })
  })
})
</script>
</body></html>`
  }

  async function handleShare() {
    try {
      let fetchedMedia: typeof mediaSources = mediaSources
      let fetchedStudents: string[] = []

      // Fetch students for the dropdown
      try {
        const res = await fetch("/api/profiles")
        const profiles = await res.json()
        fetchedStudents = (Array.isArray(profiles) ? profiles : [])
          .filter((p: any) => p.role === "student" && p.grade_assigned === selectedGrade)
          .map((p: any) => p.full_name)
        ;(window as any).__SYLLABUS_STUDENTS__ = fetchedStudents
      } catch {}

      // Fetch objectives for Learning Objectives section
      try {
        const res = await fetch(`/api/syllabus/objectives?grade=${selectedGrade}`)
        const data = await res.json()
        if (Array.isArray(data)) (window as any).__SYLLABUS_OBJECTIVES__ = data
      } catch {}

      // Fetch media sources from saved syllabus plan if available
      try {
        const { data: saved } = await (supabase.from("syllabus_planning") as any)
          .select("media_links")
          .eq("academic_year", "2026-2027")
          .eq("grade", selectedGrade)
          .eq("week_number", selectedWeek)
          .single()
        if (saved?.media_links) {
          fetchedMedia = saved.media_links
          setMediaSources(saved.media_links)
        }
      } catch {}

      // Save syllabus first to get an ID for the public URL
      if (!plan.id) {
        const saved = await handleSave(true)
        if (!saved) { toast.error("Please save the syllabus first"); return }
        await new Promise(r => setTimeout(r, 500))
        await fetchData() // reload to get the new ID
      }

      const publicUrl = plan.id ? `${window.location.origin}/syllabus/public/${plan.id}` : null

      const html = getShareHtml(fetchedMedia)
      const blob = new Blob([html], { type: "text/html;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a"); a.href = url; a.download = `syllabus-G${selectedGrade}-W${selectedWeek}.html`; a.click()
      URL.revokeObjectURL(url)

      if (publicUrl) {
        try { await navigator.clipboard.writeText(publicUrl); toast.success("Public URL copied to clipboard! Share this link.") }
        catch { toast.success(`Public URL: ${publicUrl}`) }
      }
    } catch { toast.error("Share failed") }
  }

  async function downloadSyllabus(format: string) {
    setDownloading(format)
    try {
      const md = generateSyllabusMD()
      const blob = new Blob([md], { type: "text/markdown" })
      
      if (format === "md" || format === "qmd") {
        const ext = format === "qmd" ? "qmd" : "md"
        const content = format === "qmd" ? `---\ntitle: "Syllabus Plan — Grade ${selectedGrade} Week ${selectedWeek}"\nformat: pdf\ntoc: true\n---\n\n${md.replace(/^---[\s\S]*?---\n\n/, "")}` : md
        const b = new Blob([content], { type: "text/markdown" })
        const url = URL.createObjectURL(b)
        const a = document.createElement("a"); a.href = url; a.download = `syllabus-G${selectedGrade}-W${selectedWeek}.${ext}`; a.click()
        URL.revokeObjectURL(url)
        toast.success(`${format.toUpperCase()} downloaded!`)
        return
      }

      // DOCX / PDF — use lesson plan generator with syllabus as content
      const curriculum = topics.find(t => selectedTopicIds.has(t.unit_id))?.curriculum ?? "Cambridge"
      const res = await fetch("/api/lesson-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          vars: {
            grade: selectedGrade, week: selectedWeek,
            year: "2026/2027", semester: "Semester 1", subject: "Physics",
            teacher: "",
            ssbat: `Students will be able to analyse and apply concepts related to ${plan.topic} in accordance with the ${curriculum} curriculum.`,
            opening: plan.opening_ideas || "Engage students with a real-world phenomenon.",
            activities: plan.activity_questions.map(q => `**Q:** ${q.question} (${q.bloom})`).join("\n\n") || "Guided worksheet and group work.",
            closing: `Students summarise key concepts. Teacher clarifies misconceptions.`,
            model: plan.calendar_status === "exam" ? "Exam Review" : "Flipped Classroom",
            assessment: `Formative assessment through worksheet and CER challenge on ${plan.topic}.`,
            resources: `${curriculum} — ${topics.filter(t => selectedTopicIds.has(t.unit_id)).map(t => t.syllabus_ref).filter(Boolean).join(", ")}`,
            vp: selectedGrade <= 9 ? "Christina Sri Waryanti, S.Pd." : "Aji Wahyu Budiyanto, M.Si",
            principal: selectedGrade <= 9 ? "Sisilia Juni Arianti, S.Pd., M.Pd." : "Dr Agustinus Joko Purwanto, S.Pd., M.M.",
            unit: "Academic",
            classwork: plan.problems.map(p => `${p.problem} (${p.level})`).join("\n"),
          },
        }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({ error: "Failed" })); toast.error(e.error); return }
      const b = await res.blob()
      const url = URL.createObjectURL(b)
      const ext = format
      const a = document.createElement("a"); a.href = url; a.download = `syllabus-G${selectedGrade}-W${selectedWeek}.${ext}`; a.click()
      URL.revokeObjectURL(url)
      toast.success(`${format.toUpperCase()} downloaded!`)
    } catch (e) {
      toast.error("Download failed: " + (e instanceof Error ? e.message : "Unknown"))
    } finally { setDownloading(null) }
  }

  const hasConflict = events.some(e => e.is_holiday || e.event_type === "blackout")
  const eventBadgeVariant = hasConflict ? "destructive" : events.length > 0 ? "secondary" : "outline"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Planner</h1>
          <p className="text-sm text-muted-foreground">
            Select topics and plan your Flipped Classroom lesson per week
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button onClick={handleAIGenerate} disabled={loading || generatingAI} variant="outline" size="sm">
            <Wand2 className="mr-1 h-3 w-3" />
            {generatingAI ? "AI Generating..." : "AI Fill"}
          </Button>
          <Button onClick={handleGenerate} disabled={loading || generating} size="sm">
            <BrainCircuit className="mr-1 h-4 w-4" />
            {generating ? "Generating..." : "Generate Pkg"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            const style = document.createElement("style"); style.id = "print-style"
            style.textContent = `@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } .no-print { display: none !important; } }`
            document.head.appendChild(style); window.print(); setTimeout(() => document.getElementById("print-style")?.remove(), 1000)
          }}>
            <Printer className="mr-1 h-3 w-3" />Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-1 h-3 w-3" />Share
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button onClick={() => handleSave()} disabled={loading} variant="outline" size="sm">
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
          {(["md", "docx", "pdf", "qmd"] as const).map((fmt) => (
            <Button key={fmt} variant="outline" size="sm" onClick={() => downloadSyllabus(fmt)} disabled={downloading === fmt}>
              {fmt === "docx" ? <FileDown className="mr-1 h-3 w-3" /> : fmt === "pdf" ? <FileText className="mr-1 h-3 w-3" /> : <FileType className="mr-1 h-3 w-3" />}
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="font-medium">Grade</Label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="font-medium">Week</Label>
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: 43 }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>Week {w}</option>
            ))}
          </select>
        </div>
        <Badge variant={eventBadgeVariant} className="gap-1">
          <CalendarDays className="h-3 w-3" />
          {events.length > 0
            ? events.map(e => e.event_name).join(", ")
            : "No events"}
        </Badge>
        {plan.status === "planned" && (
          <Badge variant="default" className="gap-1">
            <BookOpen className="h-3 w-3" />
            Planned
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Syllabus Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : topics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No topics found for this grade.</p>
              ) : (
                topics.map((t) => (
                  <div key={t.id} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                    <Checkbox
                      checked={selectedTopicIds.has(t.unit_id)}
                      onCheckedChange={() => toggleTopic(t.unit_id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.unit_id}</span>
                        <span className="text-sm">{t.topic}</span>
                        <Badge variant="outline" className="text-xs">{t.curriculum}</Badge>
                      </div>
                      {t.subtopics.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.subtopics.map((st, i) => (
                            <span key={i} className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{st}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          {selectedTopicIds.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  Learning Objectives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topics.filter(t => selectedTopicIds.has(t.unit_id)).map(t => {
                    const obj = objectives.find(o => o.topic.toLowerCase() === t.topic.toLowerCase())
                    const items = obj?.objectives || []
                    return (
                      <div key={t.id} className="rounded-lg border border-green-200 bg-green-50/50 p-3 dark:border-green-800 dark:bg-green-950/30">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">✓</div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{t.topic}</p>
                            <p className="text-xs text-muted-foreground mb-2">{t.syllabus_ref} · {t.curriculum}</p>
                            {items.length > 0 ? (
                              <ul className="space-y-1">
                                {items.map((objText: string, oi: number) => (
                                  <li key={oi} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span>{objText}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : t.subtopics.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {t.subtopics.map((st, si) => (
                                  <span key={si} className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-1.5 py-0.5 rounded">{st}</span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Opening Ideas (Hook / MythBuster)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={plan.opening_ideas}
                onChange={(e) => setPlan(prev => ({ ...prev, opening_ideas: e.target.value }))}
                placeholder="e.g. 'Why do astronauts float if gravity is 90% as strong in orbit?' — real-world hook to spark curiosity..."
                rows={4}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Phase 1 (5 min): Entry Ticket & Hook — a provocative question or myth to engage
              </p>

              {/* Source of Lesson — Opening Ideas */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Source of Lesson</p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setMediaForm({ section: "opening", type: "youtube", title: "", url: "" }); setShowMediaForm(showMediaForm === "opening" ? null : "opening") }}>
                    <Plus className="mr-1 h-3 w-3" />Add Source
                  </Button>
                </div>
                {mediaSources.filter(s => s.section === "opening").map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between rounded border p-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.type === "youtube" ? <Video className="h-3 w-3 shrink-0" /> : s.type === "audio" ? <Music className="h-3 w-3 shrink-0" /> : <LinkIcon className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{s.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEditSource("opening", i)} className="text-primary hover:underline">Edit</button>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open</a>
                        <button onClick={() => removeMediaSource("opening", i)} className="text-destructive hover:underline ml-1">Remove</button>
                      </div>
                    </div>
                    {mediaPreview(s)}
                  </div>
                ))}
                {showMediaForm === "opening" && (
                  <div className="rounded border p-2 space-y-1 bg-muted/30">
                    <select value={mediaForm.type} onChange={(e) => setMediaForm(p => ({ ...p, type: e.target.value }))} className="h-7 w-full rounded border border-input bg-background px-2 text-xs">
                      <option value="youtube">YouTube Video</option>
                      <option value="pdf">PDF Document</option>
                      <option value="slides">Slides</option>
                      <option value="audio">Audio</option>
                    </select>
                    <input value={mediaForm.title} onChange={(e) => setMediaForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-7 w-full rounded border border-input bg-background px-2 text-xs" />
                    <input value={mediaForm.url} onChange={(e) => setMediaForm(p => ({ ...p, url: e.target.value }))} placeholder="YouTube: https://youtube.com/watch?v=VIDEO_ID" className="h-7 w-full rounded border border-input bg-background px-2 text-xs" />
                    <p className="text-[10px] text-muted-foreground">YouTube: <code className="bg-muted px-1">https://youtube.com/watch?v=VIDEO_ID</code> · PDF: Google Drive link or direct .pdf URL</p>
                    <div className="flex gap-1">
                      <Button size="sm" className="h-7 text-xs" onClick={addMediaSource}>Add</Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Questions (Productive Struggle)</CardTitle>
              <Button variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="mr-1 h-3 w-3" /> Add Question
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.activity_questions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add Level 1-2 questions for the Productive Struggle phase (20 min).
                </p>
              )}
              {plan.activity_questions.map((q, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(i, "question", e.target.value)}
                      placeholder={`Question ${i + 1}`}
                    />
                    <div className="flex gap-2">
                      <select
                        value={q.bloom ?? "analyze"}
                        onChange={(e) => updateQuestion(i, "bloom", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="remember">Remember</option>
                        <option value="understand">Understand</option>
                        <option value="apply">Apply</option>
                        <option value="analyze">Analyze</option>
                        <option value="evaluate">Evaluate</option>
                        <option value="create">Create</option>
                      </select>
                      <select
                        value={q.timing ?? "20 min"}
                        onChange={(e) => updateQuestion(i, "timing", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="10 min">10 min (Level 1)</option>
                        <option value="20 min">20 min (Level 2)</option>
                        <option value="10 min CER">10 min (Level 3 CER)</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestion(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Source of Lesson — Activity Questions */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">Source of Lesson</p>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => { setMediaForm({ section: "questions", type: "youtube", title: "", url: "" }); setShowMediaForm(showMediaForm === "questions" ? null : "questions") }}>
                    <Plus className="mr-1 h-3 w-3" />Add Source
                  </Button>
                </div>
                {mediaSources.filter(s => s.section === "questions").map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between rounded border p-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {s.type === "youtube" ? <Video className="h-3 w-3 shrink-0" /> : s.type === "audio" ? <Music className="h-3 w-3 shrink-0" /> : <LinkIcon className="h-3 w-3 shrink-0" />}
                        <span className="truncate">{s.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEditSource("questions", i)} className="text-primary hover:underline">Edit</button>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open</a>
                        <button onClick={() => removeMediaSource("questions", i)} className="text-destructive hover:underline ml-1">Remove</button>
                      </div>
                    </div>
                    {mediaPreview(s)}
                  </div>
                ))}
                {showMediaForm === "questions" && (
                  <div className="rounded border p-2 space-y-1 bg-muted/30">
                    <select value={mediaForm.type} onChange={(e) => setMediaForm(p => ({ ...p, type: e.target.value }))} className="h-7 w-full rounded border border-input bg-background px-2 text-xs">
                      <option value="youtube">YouTube Video</option>
                      <option value="pdf">PDF Document</option>
                      <option value="slides">Slides</option>
                      <option value="audio">Audio</option>
                    </select>
                    <input value={mediaForm.title} onChange={(e) => setMediaForm(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="h-7 w-full rounded border border-input bg-background px-2 text-xs" />
                    <input value={mediaForm.url} onChange={(e) => setMediaForm(p => ({ ...p, url: e.target.value }))} placeholder="YouTube: https://youtube.com/watch?v=VIDEO_ID" className="h-7 w-full rounded border border-input bg-background px-2 text-xs" />
                    <p className="text-[10px] text-muted-foreground">YouTube: <code className="bg-muted px-1">https://youtube.com/watch?v=VIDEO_ID</code> · PDF: Google Drive link or direct .pdf URL</p>
                    <Button size="sm" className="h-7 text-xs" onClick={addMediaSource}>Add</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Problems (CER / HOTS)</CardTitle>
              <Button variant="outline" size="sm" onClick={addProblem}>
                <Plus className="mr-1 h-3 w-3" /> Add Problem
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.problems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add Level 3 CER Challenge problems (10 min) or HOTS past paper questions.
                </p>
              )}
              {plan.problems.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={p.problem}
                      onChange={(e) => updateProblem(i, "problem", e.target.value)}
                      placeholder={`Problem ${i + 1}`}
                    />
                    <div className="flex gap-2">
                      <select
                        value={p.level ?? "L2"}
                        onChange={(e) => updateProblem(i, "level", e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="L1">L1: Sanity Check</option>
                        <option value="L2">L2: Mistake Hunter</option>
                        <option value="L3">L3: CER Challenge</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeProblem(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events this week.</p>
              ) : (
                events.map((e) => (
                  <div key={e.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{e.event_name}</span>
                      <Badge variant={e.is_holiday ? "destructive" : "secondary"} className="text-xs">
                        {e.event_type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e.start_date} — {e.end_date}
                    </p>
                    {e.effective_days && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Effective days: {e.effective_days}
                      </p>
                    )}
                    {e.is_holiday && (
                      <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Holiday — adjust teaching plan
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Flipped Classroom
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">40-minute structure:</p>
              {FlippedPhases.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <span>{f.icon} {f.phase}</span>
                  <Badge variant="outline">{f.minutes} min</Badge>
                </div>
              ))}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                <strong>HARD RULES:</strong> No calculus. CER required Level 3. "Ask 3 Before Me". "No Eraser". Mistake Journal every lesson.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
              SHB Load
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hours/week:</span>
                <span className="font-medium">{selectedGrade <= 10 ? 3 : 4}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Effective days:</span>
                <span className="font-medium">{events[0]?.effective_days ?? 5}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lesson duration:</span>
                <span className="font-medium">40 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Curriculum:</span>
                <span className="font-medium">
                  {selectedGrade <= 8 ? "Lower Sec" : selectedGrade <= 10 ? "IGCSE" : selectedGrade === 11 ? "AS Level" : "A Level + TKA"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
