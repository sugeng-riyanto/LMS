"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Pencil, Trash2, Save, X } from "lucide-react"
import toast from "react-hot-toast"

interface JournalEntry {
  id: string
  topic: string
  mistake_description: string
  root_cause: string
  correct_approach: string
  law_or_principle: string
  teacher_feedback: string | null
  created_at: string
}

const emptyForm = {
  topic: "",
  mistake_description: "",
  root_cause: "",
  correct_approach: "",
  law_or_principle: "",
}

export default function MyJournalPage() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (profile?.id) {
      fetchEntries()
    }
  }, [profile])

  async function fetchEntries() {
    try {
      const res = await fetch("/api/journals")
      if (res.ok) setEntries(await res.json())
    } catch {
      toast.error("Failed to load journal entries.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!profile) return
    try {
      const body = {
        ...form,
        grade: profile.grade,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/journals/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/journals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }
      if (res.ok) {
        toast.success(editingId ? "Entry updated!" : "Entry created!")
        setForm(emptyForm)
        setShowForm(false)
        setEditingId(null)
        fetchEntries()
      } else {
        toast.error("Failed to save entry.")
      }
    } catch {
      toast.error("Failed to save entry.")
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return
    try {
      const res = await fetch(`/api/journals/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Entry deleted.")
        setEntries((prev) => prev.filter((e) => e.id !== id))
      }
    } catch {
      toast.error("Failed to delete entry.")
    }
  }

  function handleEdit(entry: JournalEntry) {
    setForm({
      topic: entry.topic,
      mistake_description: entry.mistake_description,
      root_cause: entry.root_cause ?? "",
      correct_approach: entry.correct_approach ?? "",
      law_or_principle: entry.law_or_principle ?? "",
    })
    setEditingId(entry.id)
    setShowForm(true)
  }

  function handleCancel() {
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Mistake Journal</h1>
          <p className="text-muted-foreground">Track mistakes and learn from them</p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New Entry
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Entry" : "New Entry"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Topic</Label>
              <Input value={form.topic} onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))} placeholder="e.g. Newton's Second Law" />
            </div>
            <div className="space-y-1">
              <Label>Mistake Description</Label>
              <Textarea value={form.mistake_description} onChange={(e) => setForm((p) => ({ ...p, mistake_description: e.target.value }))} placeholder="What went wrong?" rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Root Cause</Label>
              <Textarea value={form.root_cause} onChange={(e) => setForm((p) => ({ ...p, root_cause: e.target.value }))} placeholder="Why did it happen?" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Correct Approach</Label>
              <Textarea value={form.correct_approach} onChange={(e) => setForm((p) => ({ ...p, correct_approach: e.target.value }))} placeholder="How should it be done?" rows={2} />
            </div>
            <div className="space-y-1">
              <Label>Law / Principle</Label>
              <Input value={form.law_or_principle} onChange={(e) => setForm((p) => ({ ...p, law_or_principle: e.target.value }))} placeholder="Relevant law or principle" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                <Save className="mr-1 h-4 w-4" />
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No journal entries yet. Start by adding your first mistake.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{entry.topic}</h3>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
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
                    {entry.teacher_feedback && (
                      <p className="text-sm text-primary">
                        <span className="font-medium">Teacher Feedback:</span> {entry.teacher_feedback}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
