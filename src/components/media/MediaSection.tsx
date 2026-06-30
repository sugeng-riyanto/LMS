"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Video, FileText, Music, LinkIcon, ExternalLink, File as FileIcon, Presentation, FileSpreadsheet } from "lucide-react"
import toast from "react-hot-toast"

interface MediaItem {
  id: string
  package_id: string
  section: string
  media_type: string
  title: string
  url: string | null
  embed_code: string | null
  sort_order: number
}

function getDrivePreviewUrl(url: string): string | null {
  // Google Drive file: https://drive.google.com/file/d/{id}/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`
  // Google Docs: https://docs.google.com/document/d/{id}
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docMatch) return `https://docs.google.com/document/d/${docMatch[1]}/preview`
  // Google Slides: https://docs.google.com/presentation/d/{id}
  const slideMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/)
  if (slideMatch) return `https://docs.google.com/presentation/d/${slideMatch[1]}/embed`
  // Google Sheets: https://docs.google.com/spreadsheets/d/{id}
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (sheetMatch) return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/preview`
  return null
}

function getDriveFileId(url: string): string | null {
  const m = url.match(/[a-zA-Z0-9_-]{25,}/)
  return m ? m[0] : null
}

function getIcon(type: string, url?: string | null) {
  if (type === "video") return Video
  if (type === "audio") return Music
  if (type === "link") return LinkIcon
  if (type === "pdf") return FileText
  if (type === "embed") return FileIcon
  if (url?.includes("presentation")) return Presentation
  if (url?.includes("spreadsheets")) return FileSpreadsheet
  if (url?.includes("document")) return FileText
  if (url?.includes("drive")) return FileIcon
  return FileText
}

function getTypeLabel(type: string, url?: string | null): string {
  if (url?.includes("presentation")) return "Slides"
  if (url?.includes("spreadsheets")) return "Sheets"
  if (url?.includes("document")) return "Doc"
  if (url?.includes("drive")) return "Drive File"
  return type
}

export default function MediaSection({ packageId, section, canEdit }: { packageId: string; section: string; canEdit: boolean }) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: "", media_type: "drive", url: "", embed_code: "" })

  useEffect(() => {
    fetch(`/api/packages/${packageId}/media?section=${section}`)
      .then((r) => r.json()).then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {}).finally(() => setLoading(false))
  }, [packageId, section])

  async function addMedia() {
    if (!form.title) { toast.error("Title is required"); return }
    const payload: Record<string, string> = { section, title: form.title, media_type: form.media_type }
    if (form.url) payload.url = form.url
    if (form.embed_code) payload.embed_code = form.embed_code
    try {
      const res = await fetch(`/api/packages/${packageId}/media`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      })
      if (res.ok) {
        const d = await res.json(); setItems((p) => [...p, d])
        setForm({ title: "", media_type: "drive", url: "", embed_code: "" }); setShowForm(false)
        toast.success("Added!")
      } else toast.error("Failed")
    } catch { toast.error("Failed") }
  }

  async function deleteMedia(id: string) {
    try {
      const res = await fetch(`/api/packages/${packageId}/media/${id}`, { method: "DELETE" })
      if (res.ok) { setItems((p) => p.filter((i) => i.id !== id)); toast.success("Deleted") }
    } catch {}
  }

  if (loading) return null

  return (
    <div className="space-y-2 mt-3">
      {items.map((item) => {
        const Icon = getIcon(item.media_type, item.url)
        const previewUrl = getDrivePreviewUrl(item.url ?? "")
        return (
          <div key={item.id} className="rounded-lg border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px]">{getTypeLabel(item.media_type, item.url)}</Badge>
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5"><ExternalLink className="h-3 w-3" />Open</a>}
                  </div>
                </div>
              </div>
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteMedia(item.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
            {/* Preview */}
            {previewUrl && (
              <div className="w-full">
                <iframe src={previewUrl} className="w-full h-48 sm:h-64 md:h-80 border-0" allow="autoplay; encrypted-media" allowFullScreen title={item.title} />
              </div>
            )}
            {item.embed_code && !previewUrl && (
              <div className="w-full" dangerouslySetInnerHTML={{ __html: item.embed_code }} />
            )}
            {item.media_type === "audio" && item.url && !previewUrl && (
              <audio controls className="w-full px-3 pb-3 h-10"><source src={item.url} /></audio>
            )}
            {item.media_type === "video" && item.url && !previewUrl && !item.embed_code && (
              <video controls className="w-full max-h-64"><source src={item.url} /></video>
            )}
          </div>
        )
      })}

      {canEdit && (
        <>
          {showForm ? (
            <div className="rounded-lg border p-3 space-y-2 bg-background">
              <p className="text-xs font-medium">Add Google Drive File</p>
              <p className="text-[10px] text-muted-foreground">Paste any Google Drive link (Doc, Slides, PDF, Sheet) — preview works automatically</p>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title (e.g. Week 1 Summary)" className="h-8 text-xs" />
              <Input value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value, media_type: "drive" }))} placeholder="Google Drive / YouTube URL" className="h-8 text-xs" />
              <div className="flex gap-1">
                <Button size="sm" className="h-7 text-xs" onClick={addMedia}><Plus className="mr-1 h-3 w-3" />Add</Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-3 w-3" />Add from Google Drive
            </Button>
          )}
        </>
      )}
    </div>
  )
}
