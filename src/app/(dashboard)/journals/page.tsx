"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, MessageSquareText, Save } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

interface JournalEntry {
  id: string
  student_id: string
  grade: number
  topic: string
  mistake_description: string
  root_cause: string | null
  correct_approach: string | null
  law_or_principle: string | null
  teacher_feedback: string | null
  created_at: string
}

export default function JournalsPage() {
  const { isSuperAdmin } = useRBAC()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterGrade, setFilterGrade] = useState<number | "all">("all")
  const [filterStudent, setFilterStudent] = useState("")
  const [filterTopic, setFilterTopic] = useState("")
  const [feedbackInput, setFeedbackInput] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchEntries()
  }, [filterGrade])

  async function fetchEntries() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterGrade !== "all") params.set("grade", String(filterGrade))
      if (filterStudent) params.set("student_id", filterStudent)
      if (filterTopic) params.set("topic", filterTopic)
      const res = await fetch(`/api/journals?${params.toString()}`)
      if (res.ok) setEntries(await res.json())
    } catch {
      toast.error("Failed to load journals.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitFeedback(entryId: string) {
    const feedback = feedbackInput[entryId]
    if (!feedback?.trim()) return
    try {
      const res = await fetch(`/api/journals/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacher_feedback: feedback }),
      })
      if (res.ok) {
        toast.success("Feedback saved!")
        setFeedbackInput((prev) => {
          const next = { ...prev }
          delete next[entryId]
          return next
        })
        fetchEntries()
      }
    } catch {
      toast.error("Failed to save feedback.")
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Journals</h1>
        <p className="text-muted-foreground">Review and provide feedback on student mistake journals</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Grade</Label>
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="all">All Grades</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Student ID</Label>
              <Input
                value={filterStudent}
                onChange={(e) => setFilterStudent(e.target.value)}
                placeholder="Filter by student"
                className="w-48"
              />
            </div>
            <div className="space-y-1">
              <Label>Topic</Label>
              <Input
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                placeholder="Filter by topic"
                className="w-48"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchEntries}>
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No journal entries found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{entry.topic}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">Grade {entry.grade}</Badge>
                        <span>Student: {entry.student_id.slice(0, 8)}...</span>
                        <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Mistake:</span> {entry.mistake_description}
                  </p>
                  {entry.root_cause && (
                    <p className="text-sm">
                      <span className="font-medium">Root Cause:</span> {entry.root_cause}
                    </p>
                  )}
                  {entry.correct_approach && (
                    <p className="text-sm">
                      <span className="font-medium">Correct Approach:</span> {entry.correct_approach}
                    </p>
                  )}
                  {entry.law_or_principle && (
                    <p className="text-sm">
                      <span className="font-medium">Law/Principle:</span> {entry.law_or_principle}
                    </p>
                  )}

                  <Separator />

                  {entry.teacher_feedback ? (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground">Teacher Feedback:</p>
                      <p className="text-sm">{entry.teacher_feedback}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={feedbackInput[entry.id] ?? ""}
                        onChange={(e) =>
                          setFeedbackInput((prev) => ({ ...prev, [entry.id]: e.target.value }))
                        }
                        placeholder="Write feedback..."
                        className="flex-1"
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitFeedback(entry.id)}
                        disabled={!feedbackInput[entry.id]?.trim()}
                      >
                        <Save className="mr-1 h-3 w-3" />
                        Send
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
