"use client"

import { useState } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Upload, Download, FileText, FileSpreadsheet, BookOpen, CheckCircle } from "lucide-react"
import { GRADES } from "@/lib/utils/constants"
import toast from "react-hot-toast"

export default function SyllabusManagerPage() {
  const { isSuperAdmin, isTeacher } = useRBAC()
  const canManage = isSuperAdmin || isTeacher

  const [uploading, setUploading] = useState<string | null>(null)
  const [selectedGrade, setSelectedGrade] = useState(10)
  const [results, setResults] = useState<string[]>([])

  async function handleUpload(format: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = format === "xlsx" ? ".xlsx,.xls" : format === "pdf" ? ".pdf" : format === "md" ? ".md" : format === "qmd" ? ".qmd" : "*"
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0]
      if (!file) return
      setUploading(format)
      setResults([])
      const fd = new FormData()
      fd.append("file", file)
      fd.append("grade", String(selectedGrade))
      try {
        const res = await fetch("/api/syllabus/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (res.ok) {
          setResults([data.message || "Uploaded successfully"])
          toast.success("Uploaded!")
        } else {
          toast.error(data.error || "Upload failed")
        }
      } catch { toast.error("Upload failed") }
      finally { setUploading(null) }
    }
    input.click()
  }

  function downloadTemplate(format: string) {
    // Generate simple syllabus template content
    let content = ""
    let filename = ""
    const topic = "Kinematics"
    const ref = selectedGrade >= 7 && selectedGrade <= 12 ? `Grade ${selectedGrade}` : ""

    if (format === "md") {
      content = `# Syllabus — ${ref}\n\n## Week 1: ${topic}\n\n**Opening Ideas:**\nWhy does motion matter?\n\n**Activity Questions:**\n1. What is speed? (remember)\n2. Calculate average velocity (apply)\n\n**Problems:**\n1. Explain core concepts (L1)\n2. Analyse case study (L2)\n\n## Resources\n- Cambridge Physics textbook\n- PhET simulations\n`
      filename = `syllabus-template-G${selectedGrade}.md`
    } else if (format === "qmd") {
      content = `---\ntitle: "Syllabus — ${ref}"\nformat: pdf\ntoc: true\n---\n\n# Syllabus\n\n## Week 1: ${topic}\n\n**Opening Ideas:**\nWhy does motion matter?\n\n**Activity Questions:**\n1. What is speed?\n2. Calculate velocity\n\n**Problems:**\n1. Core concepts (L1)\n2. Case study (L2)\n`
      filename = `syllabus-template-G${selectedGrade}.qmd`
    } else if (format === "xlsx") {
      // Use the existing user template approach for XLSX
      toast.success("XLSX template feature coming")
      return
    }

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    toast.success(`${format.toUpperCase()} template downloaded`)
  }

  if (!canManage) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Access denied.</p></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Syllabus Manager</h1>
        <p className="text-sm text-muted-foreground">Upload and manage syllabus documents</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Upload Syllabus</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Grade</Label>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm">
              {GRADES.map((g) => (<option key={g} value={g}>Grade {g}</option>))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { format: "md", icon: FileText, label: "Markdown", desc: ".md" },
              { format: "qmd", icon: FileText, label: "Quarto", desc: ".qmd" },
              { format: "pdf", icon: FileText, label: "PDF", desc: ".pdf" },
              { format: "xlsx", icon: FileSpreadsheet, label: "Excel", desc: ".xlsx" },
            ].map(({ format, icon: Icon, label, desc }) => (
              <div key={format} className="flex flex-col items-center gap-2 rounded-lg border p-4 w-32">
                <Icon className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-[10px] text-muted-foreground">{desc}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => downloadTemplate(format)}>
                    <Download className="mr-1 h-3 w-3" />Template
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={() => handleUpload(format)} disabled={uploading === format}>
                    <Upload className="mr-1 h-3 w-3" />{uploading === format ? "..." : "Upload"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Upload Results</CardTitle></CardHeader>
          <CardContent>
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />{r}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Stored Syllabuses</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Uploaded syllabus files are stored and linked to the selected grade. 
            They appear here once uploaded.
          </p>
          {/* Syllabus list would go here - can be expanded */}
        </CardContent>
      </Card>
    </div>
  )
}
