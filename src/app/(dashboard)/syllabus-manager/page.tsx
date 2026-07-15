"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useRBAC } from "@/hooks/use-rbac"
import { useTeacherSubjects } from "@/hooks/use-teacher-subjects"
import { useSubjectsForTeacher, useSubjects } from "@/hooks/use-subjects"
import { GRADES } from "@/lib/utils/constants"
import { Download, Upload, FileText, FileSpreadsheet, CheckCircle, ChevronDown, ChevronRight, Loader2, Save, BookOpen, ListOrdered, Pencil, Trash2, Table2 } from "lucide-react"
import toast from "react-hot-toast"

interface SyllabusTopicRow {
  id: string
  grade: number
  unit_id: string
  topic: string
  subtopics: string[]
  syllabus_ref: string
  curriculum: string
  suggested_weeks: number[]
  subject: string
  created_at: string
}

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
  const { subjects: availableSubjects } = useSubjectsForTeacher(teacherSubjects)
  const { subjects: allSubjects } = useSubjects()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<"upload" | "excel" | "list">("list")
  const [subject, setSubject] = useState("PHY")
  const [grade, setGrade] = useState(10)
  const [pasteText, setPasteText] = useState("")
  const [fileName, setFileName] = useState("")
  const [parsing, setParsing] = useState(false)
  const [result, setResult] = useState<{ topics: ParsedTopic[]; curriculum: string; distribution: DistItem[]; sourceType: string; saved?: number; message: string } | null>(null)
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState<{ message: string; saved: number; total: number; errors: number } | null>(null)

  const [rows, setRows] = useState<SyllabusTopicRow[]>([])
  const [loadingRows, setLoadingRows] = useState(false)
  const [filterSubject, setFilterSubject] = useState("")
  const [filterGrade, setFilterGrade] = useState<number | "">("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ topic: "", unit_id: "", syllabus_ref: "", curriculum: "" })
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [templateSubject, setTemplateSubject] = useState("PHY")
  const [templateGrade, setTemplateGrade] = useState(10)
  const [downloading, setDownloading] = useState(false)

  
  const fetchRows = useCallback(async () => {
    setLoadingRows(true)
    try {
      const params = new URLSearchParams()
      if (filterSubject) params.set("subject", filterSubject)
      if (filterGrade) params.set("grade", String(filterGrade))
      const res = await fetch(`/api/syllabus/topics?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRows(Array.isArray(data) ? data : [])
      }
    } catch { } finally { setLoadingRows(false) }
  }, [filterSubject, filterGrade])

  useEffect(() => { fetchRows() }, [fetchRows])

  const toggleExpand = (i: number) => {
    const next = new Set(expandedTopics)
    if (next.has(i)) next.delete(i); else next.add(i)
    setExpandedTopics(next)
  }

  async function handleParse() {
    if (!pasteText.trim() && !fileName) { toast.error("Upload a file or paste syllabus content"); return }
    setParsing(true); setResult(null); setSaved(false)
    try {
      const formData = new FormData()
      if (fileInputRef.current?.files?.[0]) formData.append("file", fileInputRef.current.files[0])
      else formData.append("content", pasteText)
      formData.append("subject", subject)
      formData.append("grade", String(grade))
      const res = await fetch("/api/syllabus/upload", { method: "POST", body: formData })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      setResult(data)
      setExpandedTopics(new Set(data.topics.length ? [0] : []))
      toast.success(data.message)
    } catch (e) { toast.error("Parse failed: " + (e instanceof Error ? e.message : "Unknown")) }
    finally { setParsing(false) }
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
      toast.success((await res.json()).message)
      setSaved(true)
      fetchRows()
    } catch (e) { toast.error("Save failed: " + (e instanceof Error ? e.message : "Unknown")) }
    finally { setSaving(false) }
  }

  async function handleBulkUpload() {
    if (!excelFile) { toast.error("Select an XLSX or CSV file"); return }
    setBulkUploading(true); setBulkResult(null)
    try {
      const formData = new FormData()
      formData.append("file", excelFile)
      formData.append("subject", subject)
      formData.append("grade", String(grade))
      const res = await fetch("/api/syllabus/bulk-upload", { method: "POST", body: formData })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const data = await res.json()
      setBulkResult(data)
      toast.success(data.message)
    } catch (e) { toast.error("Bulk upload failed: " + (e instanceof Error ? e.message : "Unknown")) }
    finally { setBulkUploading(false) }
  }

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/syllabus/template?subject=${templateSubject}&grade=${templateGrade}`)
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${templateSubject}-Grade${templateGrade}-Syllabus-Template.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Template downloaded!")
    } catch (e) { toast.error("Download failed: " + (e instanceof Error ? e.message : "Unknown")) }
    finally { setDownloading(false) }
  }

  async function handleUpdate(id: string) {
    try {
      const res = await fetch("/api/syllabus/topics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Updated!")
      setEditingId(null)
      fetchRows()
    } catch (e) { toast.error("Update failed: " + (e instanceof Error ? e.message : "Unknown")) }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/syllabus/topics?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Deleted!")
      fetchRows()
    } catch (e) { toast.error("Delete failed") }
    finally { setDeleting(null) }
  }

  async function handleBulkDelete() {
    if (selectedTopicIds.size === 0) { toast.error("No topics selected"); return }
    if (!confirm(`Delete ${selectedTopicIds.size} topic(s)?`)) return
    setBulkDeleting(true)
    try {
      const ids = Array.from(selectedTopicIds).join(",")
      const res = await fetch(`/api/syllabus/topics?ids=${ids}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); setSelectedTopicIds(new Set()); fetchRows() }
      else toast.error(data.error || "Failed")
    } catch { toast.error("Failed") }
    finally { setBulkDeleting(false) }
  }

  async function handleDeleteAll() {
    if (rows.length === 0) { toast.error("No topics to delete"); return }
    if (!confirm(`Delete ALL ${rows.length} topics? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      const ids = rows.map(r => r.id).join(",")
      const res = await fetch(`/api/syllabus/topics?ids=${ids}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); setSelectedTopicIds(new Set()); fetchRows() }
      else toast.error(data.error || "Failed")
    } catch { toast.error("Failed") }
    finally { setBulkDeleting(false) }
  }

  function resetForm() {
    setPasteText(""); setFileName(""); setResult(null); setSaved(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (!canManagePackages) {
    return <div className="flex h-[50vh] items-center justify-center"><p className="text-sm text-muted-foreground">No access.</p></div>
  }

  const listContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32">
          <option value="">All Subjects</option>
          {availableSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
        </select>
        <select value={filterGrade} onChange={e => setFilterGrade(e.target.value ? Number(e.target.value) : "")}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm w-28">
          <option value="">All Grades</option>
          {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <Badge variant="secondary" className="text-xs">{rows.length} topics</Badge>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-[10px]" disabled={selectedTopicIds.size === 0 || bulkDeleting}
            onClick={handleBulkDelete}>
            {bulkDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Delete ({selectedTopicIds.size})
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive" disabled={rows.length === 0 || bulkDeleting}
            onClick={handleDeleteAll}>
            Delete All
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-[10px]" disabled={rows.length === 0}
            onClick={() => {
              if (selectedTopicIds.size === rows.length) setSelectedTopicIds(new Set())
              else setSelectedTopicIds(new Set(rows.map(r => r.id)))
            }}>
            {selectedTopicIds.size === rows.length ? "Deselect" : "Select All"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border max-h-[500px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-8">
                <input type="checkbox" checked={selectedTopicIds.size === rows.length && rows.length > 0}
                  onChange={() => {
                    if (selectedTopicIds.size === rows.length) setSelectedTopicIds(new Set())
                    else setSelectedTopicIds(new Set(rows.map(r => r.id)))
                  }}
                  className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
              </TableHead>
              <TableHead className="text-xs w-12">Grade</TableHead>
              <TableHead className="text-xs">Subject</TableHead>
              <TableHead className="text-xs">Topic</TableHead>
              <TableHead className="text-xs w-20">Curriculum</TableHead>
              <TableHead className="text-xs w-20">Weeks</TableHead>
              <TableHead className="text-xs w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRows ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No topics. Upload a syllabus above.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className={selectedTopicIds.has(r.id) ? "bg-primary/5" : ""}>
                <TableCell className="text-xs">
                  <input type="checkbox" checked={selectedTopicIds.has(r.id)}
                    onChange={() => {
                      const next = new Set(selectedTopicIds)
                      if (next.has(r.id)) next.delete(r.id)
                      else next.add(r.id)
                      setSelectedTopicIds(next)
                    }}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer" />
                </TableCell>
                <TableCell className="text-xs">{r.grade}</TableCell>
                <TableCell className="text-xs">{r.subject}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {editingId === r.id ? (
                    <div className="flex flex-col gap-1">
                      <Input value={editForm.topic} onChange={e => setEditForm(p => ({ ...p, topic: e.target.value }))} className="h-7 text-xs" />
                      <Input value={editForm.unit_id} onChange={e => setEditForm(p => ({ ...p, unit_id: e.target.value }))} className="h-7 text-xs" placeholder="unit_id" />
                    </div>
                  ) : r.topic}
                </TableCell>
                <TableCell className="text-xs">
                  {editingId === r.id ? (
                    <Input value={editForm.curriculum} onChange={e => setEditForm(p => ({ ...p, curriculum: e.target.value }))} className="h-7 text-xs" />
                  ) : (
                    <Badge variant="outline" className="text-[10px]">{r.curriculum}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">{(r.suggested_weeks || []).length}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingId === r.id ? (
                      <>
                        <Button size="sm" className="h-7 text-[10px]" onClick={() => handleUpdate(r.id)}>Save</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingId(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(r.id); setEditForm({ topic: r.topic, unit_id: r.unit_id, syllabus_ref: r.syllabus_ref || "", curriculum: r.curriculum }) }}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(r.id)} disabled={deleting === r.id}>
                          {deleting === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )

  const excelContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Table2 className="h-4 w-4" />
          Bulk Upload (Excel / CSV Template)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Download a template first, fill it in, then upload here. The template has 22 weeks pre-filled with Cambridge-aligned topics for your subject and grade.
        </p>
        <Separator />
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <Label>Subject</Label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32">
              {availableSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
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
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => excelInputRef.current?.click()} className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Choose File
          </Button>
          <span className="text-sm text-muted-foreground">{excelFile ? excelFile.name : "No file"}</span>
        </div>
        <input ref={excelInputRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={e => setExcelFile(e.target.files?.[0] || null)} />
        <div className="flex gap-2">
          <Button onClick={handleBulkUpload} disabled={bulkUploading || !excelFile} className="gap-2">
            {bulkUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {bulkUploading ? "Uploading..." : "Upload & Save"}
          </Button>
          <Button variant="outline" onClick={() => { setExcelFile(null); setBulkResult(null); if (excelInputRef.current) excelInputRef.current.value = "" }}>
            Clear
          </Button>
        </div>
        {bulkResult && (
          <div className={`rounded-lg border p-3 text-sm ${bulkResult.errors > 0 ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}`}>
            <p>{bulkResult.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{bulkResult.saved} saved / {bulkResult.total} total</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const templateContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" />
          Download Syllabus Template
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Download a pre-filled Excel template with 22 weeks of Cambridge-aligned topics. Fill in your lesson details, then upload via the <strong>Excel/CSV</strong> tab.
        </p>
        <Separator />
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Subject</Label>
            <select value={templateSubject} onChange={e => setTemplateSubject(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-32">
              {allSubjects.map(s => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Grade</Label>
            <select value={templateGrade} onChange={e => setTemplateGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm w-24">
              {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <Button onClick={handleDownloadTemplate} disabled={downloading} className="gap-2">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Downloading..." : "Download Template"}
          </Button>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Template columns:</p>
          <p><strong>Week</strong> (pre-filled 1-22) · <strong>Topic</strong> (pre-filled) · <strong>Subtopics</strong> (comma-separated) · <strong>Opening Ideas</strong></p>
          <p><strong>Activity Questions</strong> (one per line: <code>Question | Bloom | Timing</code>) · <strong>Problems</strong> (one per line: <code>Problem | Level</code>)</p>
          <p><strong>Score Category</strong> · <strong>Max Score</strong> · <strong>Media Links</strong> · <strong>Objectives</strong> · <strong>Milestone</strong> · <strong>Reflection</strong></p>
          <p className="text-green-600 font-medium mt-1">✅ Objectives column otomatis disimpan ke <code>syllabus_topics</code> — cukup upload XLSX sekali!</p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Manager</h1>
          <p className="text-sm text-muted-foreground">Master syllabus per subject & grade. Upload, template, and manage your curriculum data.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "list" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("list")}>
            <ListOrdered className="mr-1 h-3 w-3" /> Data ({rows.length})
          </Button>
          <Button variant={activeTab === "excel" ? "default" : "outline"} size="sm" onClick={() => setActiveTab("excel")}>
            <Table2 className="mr-1 h-3 w-3" /> Excel/CSV
          </Button>
        </div>
      </div>

      {templateContent}

      <Separator />

      {activeTab === "list" ? listContent : excelContent}

      {result && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Parse Results
                  <Badge variant="secondary" className="text-xs">{result.curriculum}</Badge>
                  <Badge variant="outline" className="text-xs">{result.sourceType}</Badge>
                  <Badge variant="outline" className="text-xs">{result.topics.length} topics</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  {saved ? (
                    <Badge className="bg-green-600 gap-1"><CheckCircle className="h-3 w-3" /> Saved</Badge>
                  ) : (
                    <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 h-8">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save to DB
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8" onClick={resetForm}>Clear</Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4" /> Topics & Objectives</CardTitle></CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {result.topics.map((t, i) => (
                  <div key={i} className="rounded-lg border">
                    <button onClick={() => toggleExpand(i)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50">
                      {expandedTopics.has(i) ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                      <span className="font-medium truncate">{t.topic}</span>
                      <Badge variant="outline" className="text-[10px] ml-auto shrink-0">{t.objectives.length}</Badge>
                    </button>
                    {expandedTopics.has(i) && (
                      <div className="border-t px-3 py-2 space-y-1">
                        {t.objectives.length > 0 ? (
                          <ul className="space-y-1">{t.objectives.map((o, oi) => <li key={oi} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-green-500 mt-0.5 shrink-0">•</span><span>{o}</span></li>)}</ul>
                        ) : <p className="text-xs text-muted-foreground italic">No objectives</p>}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Week Distribution <Badge variant="outline" className="text-xs">{new Set(result.distribution.map(d => d.week)).size} weeks</Badge></CardTitle></CardHeader>
              <CardContent className="max-h-80 overflow-y-auto">
                <div className="space-y-1">{result.distribution.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border px-2 py-1 text-xs">
                    <Badge variant="secondary" className="shrink-0 text-[10px]">W{d.week}</Badge>
                    <span className="truncate">{d.topic}</span>
                    {d.objectives.length > 0 && <span className="text-muted-foreground shrink-0 ml-auto">({d.objectives.length})</span>}
                  </div>
                ))}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
