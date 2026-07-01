"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRBAC } from "@/hooks/use-rbac"
import { Plus, Trash2, Share2, ExternalLink, Loader2 } from "lucide-react"
import toast from "react-hot-toast"

interface Worksheet {
  id: string
  title: string
  grade: number
  week_number: number | null
  topic: string | null
  pdf_url: string
  pdf_pages: number
  media_links: { type: string; url: string; title: string }[]
  created_at: string
}

export default function WorksheetsPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canManage = isSuperAdmin || isTeacher
  const [worksheets, setWorksheets] = useState<Worksheet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: "", grade: "10", week_number: "", topic: "", pdf_url: "", pdf_pages: "1", media_links: "" })

  async function load() {
    try {
      const res = await fetch("/api/worksheets")
      if (res.ok) setWorksheets(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form.title || !form.pdf_url) { toast.error("Title and PDF URL required"); return }
    setSaving(true)
    try {
      const mediaLinks = form.media_links ? form.media_links.split("\n").filter(Boolean).map((line) => {
        const [url, title = "", type = "pdf"] = line.split("|").map(s => s.trim())
        return { url, title, type }
      }) : []

      const res = await fetch("/api/worksheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          grade: Number(form.grade),
          week_number: form.week_number ? Number(form.week_number) : null,
          topic: form.topic || null,
          pdf_url: form.pdf_url,
          pdf_pages: Number(form.pdf_pages) || 1,
          media_links: mediaLinks,
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Worksheet created!")
      setShowForm(false)
      setForm({ title: "", grade: "10", week_number: "", topic: "", pdf_url: "", pdf_pages: "1", media_links: "" })
      load()
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this worksheet?")) return
    try {
      const res = await fetch(`/api/worksheets/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted"); load() }
      else toast.error("Failed to delete")
    } catch { toast.error("Failed") }
  }

  if (!canManage) return <p className="p-8 text-center text-muted-foreground">Access denied.</p>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shared Worksheets</h1>
          <p className="text-sm text-muted-foreground">Upload PDF worksheets for students to annotate online</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-1 h-4 w-4" /> {showForm ? "Close" : "New Worksheet"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Kinematics Worksheet Week 3" />
              </div>
              <div className="space-y-2">
                <Label>Grade *</Label>
                <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={form.grade} onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}>
                  {[7,8,9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Week Number</Label>
                <Input value={form.week_number} onChange={e => setForm(p => ({ ...p, week_number: e.target.value }))} placeholder="e.g. 3" />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Kinematics" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>PDF URL (Google Drive or direct link) *</Label>
                <Input value={form.pdf_url} onChange={e => setForm(p => ({ ...p, pdf_url: e.target.value }))} placeholder="https://docs.google.com/document/d/..." />
              </div>
              <div className="space-y-2">
                <Label>Number of Pages</Label>
                <Input type="number" min={1} max={50} value={form.pdf_pages} onChange={e => setForm(p => ({ ...p, pdf_pages: e.target.value }))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Media Links (one per line: url | title | type)</Label>
                <textarea className="w-full min-h-[80px] rounded-lg border border-input bg-background p-2 text-sm" value={form.media_links} onChange={e => setForm(p => ({ ...p, media_links: e.target.value }))} placeholder="https://youtube.com/watch?v=... | Intro Video | youtube&#10;https://drive.google.com/... | Notes | slides" />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Worksheet"}
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : worksheets.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No worksheets yet. Create one above!</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {worksheets.map(ws => {
            const publicUrl = `${window.location.origin}/worksheet/public/${ws.id}`
            return (
              <Card key={ws.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{ws.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Grade {ws.grade}{ws.week_number ? ` · Week ${ws.week_number}` : ""}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(ws.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ws.topic && <Badge variant="secondary" className="mb-2">{ws.topic}</Badge>}
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => window.open(publicUrl, "_blank")}>
                      <ExternalLink className="mr-1 h-3 w-3" /> Open
                    </Button>
                    <Button size="sm" variant="outline" onClick={async () => {
                      await navigator.clipboard.writeText(publicUrl)
                      toast.success("Link copied!")
                    }}>
                      <Share2 className="mr-1 h-3 w-3" /> Share
                    </Button>
                  </div>
                  <div className="mt-2 text-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(publicUrl)}`}
                      alt="QR" className="w-16 h-16 mx-auto rounded border"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
