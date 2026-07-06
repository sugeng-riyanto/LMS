"use client"

import { useState, useEffect, useMemo } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useTeacherSubjects } from "@/hooks/use-teacher-subjects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, FileText, FileSpreadsheet, BookOpen, CheckCircle, Trash2, ExternalLink, Video, Music, Link } from "lucide-react"
import { GRADES, SUBJECTS } from "@/lib/utils/constants"
import toast from "react-hot-toast"

export default function SyllabusManagerPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const teacherSubjects = useTeacherSubjects()
  const canManage = isSuperAdmin || isTeacher

  const [activeTab, setActiveTab] = useState("upload")
  const [selectedGrade, setSelectedGrade] = useState(10)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const availableSubjects = useMemo(() => {
    return SUBJECTS.filter(s => teacherSubjects.length === 0 || teacherSubjects.includes(s.code))
  }, [teacherSubjects])

  useEffect(() => {
    if (availableSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(availableSubjects[0].code)
    }
  }, [availableSubjects, selectedSubject])

  useEffect(() => {
    if (canManage) {
      fetch(`/api/syllabus/documents?grade=${selectedGrade}&subject=${selectedSubject}`)
        .then((r) => r.json())
        .then((d) => setDocs(Array.isArray(d) ? d : []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [canManage, selectedGrade])

  async function handleUpload(format: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = format === "xlsx" ? ".xlsx" : format === "pdf" ? ".pdf" : format === "md" ? ".md" : ".qmd"
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return
      setUploading(format)
      const fd = new FormData()
      fd.append("file", file); fd.append("grade", String(selectedGrade)); fd.append("subject", selectedSubject)
      try {
        const res = await fetch("/api/syllabus/upload", { method: "POST", body: fd })
        if (res.ok) { toast.success("Uploaded!"); fetch(`/api/syllabus/documents?grade=${selectedGrade}&subject=${selectedSubject}`).then(r => r.json()).then(setDocs) }
        else { const e = await res.json(); toast.error(e.error || "Failed") }
      } catch { toast.error("Failed") }
      finally { setUploading(null) }
    }
    input.click()
  }

  function downloadTemplate(format: string) {
    const topic = "Kinematics"
    const ref = `Grade ${selectedGrade}`
    let content = "", filename = ""
    if (format === "md") {
      content = `# Syllabus — ${ref}\n\n## Week 1: ${topic}\n\n**Opening Ideas:**\nWhy does motion matter?\n\n**Activity Questions:**\n1. What is speed?\n2. Calculate velocity\n\n---\n\n## Resources\n- Cambridge Physics textbook\n`
      filename = `syllabus-template-G${selectedGrade}.md`
    } else if (format === "qmd") {
      content = `---\ntitle: "Syllabus — ${ref}"\nformat: pdf\ntoc: true\n---\n\n# Syllabus\n\n## Week 1: ${topic}\n\n**Opening Ideas:**\nWhy does motion matter?\n\n**Questions:**\n1. What is speed?\n2. Calculate velocity\n`
      filename = `syllabus-template-G${selectedGrade}.qmd`
    } else { toast.success("XLSX template coming"); return }
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url); toast.success(`Template downloaded`)
  }

  if (!canManage) return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Syllabus Manager</h1>
          <p className="text-sm text-muted-foreground">Upload, organise, and publish syllabus documents in Markdown, Quarto, PDF, or Excel format. Manage files by grade and subject, set assessment categories, and publish for student access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Grade</Label>
          <select value={selectedGrade} onChange={(e) => setSelectedGrade(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
          </select>
          <Label className="text-xs">Subject</Label>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm">
            {availableSubjects.map((s) => (<option key={s.code} value={s.code}>{s.icon} {s.name}</option>))}
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload"><Upload className="mr-1 h-4 w-4" />Upload</TabsTrigger>
          <TabsTrigger value="files"><FileText className="mr-1 h-4 w-4" />Files ({docs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Upload Syllabus File</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { format: "md", icon: FileText, label: "Markdown", desc: "Editable text format", color: "border-border bg-accent" },
                  { format: "qmd", icon: FileText, label: "Quarto", desc: "PDF-ready markdown", color: "border-purple-200 bg-purple-50" },
                  { format: "pdf", icon: FileText, label: "PDF", desc: "Document format", color: "border-red-200 bg-red-50" },
                  { format: "xlsx", icon: FileSpreadsheet, label: "Excel", desc: "Spreadsheet", color: "border-green-200 bg-green-50" },
                ].map(({ format, icon: Icon, label, desc, color }) => (
                  <div key={format} className={`rounded-lg border-2 p-4 text-center space-y-2 ${color}`}>
                    <Icon className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                    <div className="flex gap-1 justify-center">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] px-2" onClick={() => downloadTemplate(format)} disabled={format === "xlsx"}>
                        <Download className="mr-1 h-3 w-3" />Template
                      </Button>
                      <Button size="sm" className="h-7 text-[10px] px-2" onClick={() => handleUpload(format)} disabled={uploading === format}>
                        <Upload className="mr-1 h-3 w-3" />{uploading === format ? "..." : "Upload"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Grade {selectedGrade} Files</CardTitle></CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />))}</div>
              ) : docs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No syllabus files for Grade {selectedGrade}. Upload one above.
                </div>
              ) : (
                <div className="space-y-2">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {doc.file_type === "pdf" ? <FileText className="h-5 w-5 text-red-500 shrink-0" /> : doc.file_type === "xlsx" ? <FileSpreadsheet className="h-5 w-5 text-green-500 shrink-0" /> : <FileText className="h-5 w-5 text-primary shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{doc.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.file_type?.toUpperCase()} · {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : "—"} · {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="flex items-center gap-2">
                          <select value={doc.score_category || ""} onChange={async (e) => {
                            const cat = e.target.value || null
                            await fetch(`/api/syllabus/documents/${doc.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ score_category: cat }),
                            })
                            doc.score_category = cat
                            setDocs(prev => [...prev])
                            toast.success(cat ? `Category set` : "Category cleared")
                          }} className="h-7 text-[10px] rounded border border-input bg-background px-1">
                            <option value="">Type</option>
                            <option value="classwork" selected={doc.score_category === "classwork"}>Classwork</option>
                            <option value="unit_test" selected={doc.score_category === "unit_test"}>Unit Test</option>
                            <option value="project" selected={doc.score_category === "project"}>Project</option>
                            <option value="homework" selected={doc.score_category === "homework"}>Homework</option>
                            <option value="mid_semester" selected={doc.score_category === "mid_semester"}>Mid Semester</option>
                            <option value="final_semester" selected={doc.score_category === "final_semester"}>Final Semester</option>
                          </select>
                          <Badge variant="outline" className="text-[10px]">G{doc.grade}</Badge>
                          {doc.subject && <Badge variant="secondary" className="text-[10px]">{SUBJECTS.find(s => s.code === doc.subject)?.icon} {doc.subject}</Badge>}
                          <Button size="sm" variant={doc.published ? "default" : "outline"} className={"h-7 text-[10px] px-2" + (doc.published ? " bg-green-600 hover:bg-green-700 text-white border-green-600" : "")} onClick={async () => {
                            try {
                              const res = await fetch(`/api/syllabus/documents/${doc.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ published: !doc.published }),
                              })
                              if (res.ok) {
                                doc.published = !doc.published
                                toast.success(doc.published ? "Published to dashboard!" : "Unpublished")
                                fetch(`/api/syllabus/documents?grade=${selectedGrade}&subject=${selectedSubject}`).then(r => r.json()).then(setDocs)
                              } else toast.error("Failed")
                            } catch { toast.error("Failed") }
                          }}>
                            {doc.published ? "✓ Published" : "Publish"}
                          </Button>
                        </div>
                        {doc.score_category && <span className="text-[9px] text-muted-foreground">{doc.score_category.replace(/_/g, " ")}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
