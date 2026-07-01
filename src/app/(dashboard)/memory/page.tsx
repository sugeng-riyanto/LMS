"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useAuth } from "@/hooks/use-auth"
import { usePackages } from "@/hooks/use-packages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, AlertTriangle, Users, StickyNote, BrainCircuit } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

interface ClassMemory {
  id: string
  grade: number
  week_number: number
  topic_taught: string | null
  misconceptions: string[]
  students_struggling: string[]
  notes_for_next_week: string | null
  created_at: string
}

const emptyForm = {
  topic_taught: "",
  misconceptions: "",
  students_struggling: "",
  notes_for_next_week: "",
}

export default function MemoryPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const { profile } = useAuth()
  const canView = isSuperAdmin || isTeacher
  const [filterGrade, setFilterGrade] = useState<number>(7)
  const [filterWeek, setFilterWeek] = useState<number>(1)
  const [memories, setMemories] = useState<ClassMemory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchMemories()
  }, [filterGrade, filterWeek])

  async function fetchMemories() {
    setLoading(true)
    try {
      const res = await fetch(`/api/memory?grade=${filterGrade}&week=${filterWeek}`)
      if (res.ok) setMemories(await res.json())
    } catch {
      toast.error("Failed to load class memory.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!profile) return
    try {
      const body = {
        grade: filterGrade,
        week_number: filterWeek,
        topic_taught: form.topic_taught || null,
        misconceptions: form.misconceptions.split("\n").filter(Boolean),
        students_struggling: form.students_struggling.split("\n").filter(Boolean),
        notes_for_next_week: form.notes_for_next_week || null,
        created_by: profile.id,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/memory/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      if (res.ok) {
        toast.success(editingId ? "Updated!" : "Created!")
        setForm(emptyForm)
        setShowForm(false)
        setEditingId(null)
        fetchMemories()
      } else {
        toast.error("Failed to save.")
      }
    } catch {
      toast.error("Failed to save.")
    }
  }

  function handleEdit(memory: ClassMemory) {
    setForm({
      topic_taught: memory.topic_taught ?? "",
      misconceptions: Array.isArray(memory.misconceptions) ? memory.misconceptions.join("\n") : "",
      students_struggling: Array.isArray(memory.students_struggling) ? memory.students_struggling.join("\n") : "",
      notes_for_next_week: memory.notes_for_next_week ?? "",
    })
    setEditingId(memory.id)
    setShowForm(true)
  }

  if (!canView) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Memory</h1>
          <p className="text-muted-foreground">Track misconceptions, struggling students, and notes</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add Entry
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Grade</Label>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(Number(e.target.value))}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Week</Label>
          <Input
            type="number"
            min={1}
            max={52}
            value={filterWeek}
            onChange={(e) => setFilterWeek(Number(e.target.value))}
            className="w-20"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchMemories}>
          Refresh
        </Button>
        {isSuperAdmin && (
          <>
            <Button variant="secondary" size="sm" onClick={async () => {
              setGenerating(true)
              try {
                const res = await fetch("/api/agents/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({}),
                })
                if (res.ok) toast.success("Generating all grades...")
                else toast.error("Generation failed")
              } catch { toast.error("Generation failed") }
              finally { setGenerating(false); setTimeout(fetchMemories, 3000) }
            }} disabled={generating}>
              <BrainCircuit className="mr-1 h-3 w-3" />{generating ? "..." : "Generate All"}
            </Button>
            <Button variant="outline" size="sm" onClick={async () => {
              setGenerating(true)
              try {
                const res = await fetch("/api/agents/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ grade: filterGrade }),
                })
                if (res.ok) toast.success(`Generating Grade ${filterGrade}...`)
                else toast.error("Generation failed")
              } catch { toast.error("Generation failed") }
              finally { setGenerating(false); setTimeout(fetchMemories, 3000) }
            }} disabled={generating}>
              <BrainCircuit className="mr-1 h-3 w-3" />{generating ? "..." : `G${filterGrade}`}
            </Button>
          </>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Memory Entry" : "New Memory Entry"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Topic Taught</Label>
              <Input value={form.topic_taught} onChange={(e) => setForm((p) => ({ ...p, topic_taught: e.target.value }))} placeholder="e.g. Newton's Laws" />
            </div>
            <div className="space-y-1">
              <Label>Misconceptions (one per line)</Label>
              <Textarea value={form.misconceptions} onChange={(e) => setForm((p) => ({ ...p, misconceptions: e.target.value }))} rows={3} placeholder="Students think force is needed to keep moving..." />
            </div>
            <div className="space-y-1">
              <Label>Struggling Students (one per line)</Label>
              <Textarea value={form.students_struggling} onChange={(e) => setForm((p) => ({ ...p, students_struggling: e.target.value }))} rows={3} placeholder="Student names or IDs" />
            </div>
            <div className="space-y-1">
              <Label>Notes for Next Week</Label>
              <Textarea value={form.notes_for_next_week} onChange={(e) => setForm((p) => ({ ...p, notes_for_next_week: e.target.value }))} rows={3} placeholder="What to revisit..." />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                <Save className="mr-1 h-4 w-4" />
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm) }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : memories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No memory entries for Grade {filterGrade}, Week {filterWeek}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {memories.map((memory) => (
            <Card key={memory.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {memory.topic_taught && (
                      <h3 className="font-semibold">{memory.topic_taught}</h3>
                    )}
                    {Array.isArray(memory.misconceptions) && memory.misconceptions.length > 0 && (
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Misconceptions</p>
                          <ul className="list-disc pl-4 text-sm text-muted-foreground">
                            {memory.misconceptions.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {Array.isArray(memory.students_struggling) && memory.students_struggling.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Struggling Students</p>
                          <p className="text-sm text-muted-foreground">{memory.students_struggling.join(", ")}</p>
                        </div>
                      </div>
                    )}
                    {memory.notes_for_next_week && (
                      <div className="flex items-start gap-2">
                        <StickyNote className="mt-0.5 h-4 w-4 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Notes</p>
                          <p className="text-sm text-muted-foreground">{memory.notes_for_next_week}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(memory.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(memory)}>
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
