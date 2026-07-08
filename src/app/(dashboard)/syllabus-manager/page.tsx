"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRBAC } from "@/hooks/use-rbac"
import { useTeacherSubjects } from "@/hooks/use-teacher-subjects"
import { SUBJECTS, GRADES } from "@/lib/utils/constants"
import { Upload, FileText, FileSpreadsheet, CheckCircle, ChevronDown, ChevronRight, Loader2, Save, BookOpen, ListOrdered } from "lucide-react"
import toast from "react-hot-toast"

interface ParsedTopic {
  unitId: string
  topic: string
  subtopics: string[]
  objectives: string[]
}

interface DistItem {
  week: number
  unitId: string
  topic: string
  objectives: string[]
}

export default function SyllabusManagerPage() {
  const { canManagePackages } = useRBAC()
  const teacherSubjects = useTeacherSubjects()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] = useState("PHY")
  const [grade, setGrade] = useState(10)
  const [pasteText, setPasteText] = useState("")
  const [fileName, setFileName] = useState("")
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<{ topics: ParsedTopic[]; curriculum: string; distribution: DistItem[]; sourceType: string; saved?: number; message: string } | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const availableSubjects = teacherSubjects.length === 0
    ? SUBJECTS
    : SUBJECTS.filter(s => teacherSubjects.includes(s.code))

  const toggleExpand = (i: number) => {
    const next = new Set(expandedTopics)
    if (next.has(i)) next.delete(i); else next.add(i)
    setExpandedTopics(next)
  }

  async function handleParse() {
    if (!pasteText.trim() && !fileName) {
      toast.error("Upload a file or paste syllabus content")
      return
    }
    setParsing(true)
    setResult(null)
    setSaved(false)
    try {
      const formData = new FormData()
      if (fileInputRef.current?.files?.[0]) {
        formData.append("file", fileInputRef.current.files[0])
      } else {
        formData.append("content", pasteText)
      }
      formData.append("subject", subject)
      formData.append("grade", String(grade))

      const res = await fetch("/api/syllabus/upload", { method: "POST", body: formData })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      setResult(data)
      setExpandedTopics(new Set(data.topics.length > 0 ? [0] : []))
      toast.success(data.message)
    } catch (e) {
      toast.error("Parse failed: " + (e instanceof Error ? e.message : "Unknown"))
    } finally { setParsing(false) }
  }

  async function handleSave() {
    if (!result?.topics.length) return
    setSaving(true)
    try {
      const res = await fetch("/api/syllabus/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics: result.topics, subject, grade, curriculum: result.curriculum }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      toast.success(data.message)
      setSaved(true)
    } catch (e) {
      toast.error("Save failed: " + (e instanceof Error ? e.message : "Unknown"))
    } finally { setSaving(false) }
  }

  function resetForm() {
    setPasteText("")
    setFileName("")
    setResult(null)
    setSaved(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (!canManagePackages) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have access to Syllabus Manager.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Manager</h1>
          <p className="text-sm text-muted-foreground">
            Upload Cambridge syllabus files (.md or .pdf) to extract topics and learning objectives, then distribute across weeks.
          </p>
        </div>
        {result && (
          <Button variant="ghost" size="sm" onClick={resetForm}>
            Upload Another
          </Button>
        )}
      </div>

      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Upload className="h-4 w-4" />
              Upload Syllabus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label>Subject</Label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32">
                  {availableSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.code}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Grade</Label>
                <select value={grade} onChange={e => setGrade(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm w-24">
                  {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Method 1: Upload file</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Choose File (.md / .pdf)
                </Button>
                <span className="text-sm text-muted-foreground">
                  {fileName || "No file selected"}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.pdf,.txt,text/markdown,application/pdf"
                className="hidden"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              />
              <p className="text-xs text-muted-foreground">
                <strong>.md</strong> (markdown) preferred — faster and more accurate.
                <br />
                <strong>.pdf</strong> will be converted to text automatically (formatting may vary).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Method 2: Paste syllabus text</Label>
              <Textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste markdown content from a Cambridge syllabus (e.g., content of convert_0625_y26-28_sy.md)..."
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            <Button onClick={handleParse} disabled={parsing} className="gap-2">
              {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {parsing ? "Parsing..." : "Parse Syllabus"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Parse Results
                  <Badge variant="secondary" className="text-xs ml-2">{result.curriculum}</Badge>
                  <Badge variant="outline" className="text-xs">{result.sourceType}</Badge>
                  <Badge variant="outline" className="text-xs">{result.topics.length} topics</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  {saved ? (
                    <Badge className="bg-green-600 gap-1">
                      <CheckCircle className="h-3 w-3" /> Saved to DB
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-8">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save to Database
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Topics & Objectives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {result.topics.map((t, i) => (
                  <div key={i} className="rounded-lg border">
                    <button
                      onClick={() => toggleExpand(i)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
                    >
                      {expandedTopics.has(i) ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                      <span className="font-medium truncate">{t.topic}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{t.objectives.length}</Badge>
                    </button>
                    {expandedTopics.has(i) && (
                      <div className="border-t px-3 py-2 space-y-1">
                        {t.objectives.length > 0 ? (
                          <ul className="space-y-1">
                            {t.objectives.map((o, oi) => (
                              <li key={oi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-green-500 mt-0.5 shrink-0">•</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">No objectives extracted</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Week Distribution
                  <Badge variant="outline" className="text-xs">{new Set(result.distribution.map(d => d.week)).size} weeks</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  {result.distribution.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
                      <Badge variant="secondary" className="shrink-0 text-[10px]">W{d.week}</Badge>
                      <span className="truncate">{d.topic}</span>
                      {d.objectives.length > 0 && (
                        <span className="text-muted-foreground shrink-0 ml-auto">({d.objectives.length})</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
