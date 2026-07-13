"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useSubjects } from "@/hooks/use-subjects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { PackageSearch, Save, Plus, Pencil, Trash2, Upload, Download } from "lucide-react"
import toast from "react-hot-toast"

interface LabItem {
  id: string
  item_name: string
  category: string | null
  subject_code: string | null
  total_quantity: number
  available_quantity: number
  broken_quantity: number
  location: string | null
  notes: string | null
}

const emptyForm = { item_name: "", category: "", subject_code: "", total_quantity: 1, available_quantity: 1, broken_quantity: 0, location: "", notes: "" }

export default function LabPage() {
  const { isSuperAdmin, isLabAssistant } = useRBAC()
  const { subjects: allSubjects } = useSubjects()
  const canManage = isSuperAdmin || isLabAssistant
  const [items, setItems] = useState<LabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch("/api/lab")
      if (res.ok) {
        const data: LabItem[] = await res.json()
        setItems(data)
        setCategories([...new Set(data.map((i) => i.category).filter(Boolean))] as string[])
      }
    } catch { toast.error("Failed to load inventory.") }
    finally { setLoading(false) }
  }

  function openAdd() {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: LabItem) {
    setEditingId(item.id)
    setForm({ item_name: item.item_name, category: item.category ?? "", subject_code: item.subject_code ?? "", total_quantity: item.total_quantity, available_quantity: item.available_quantity, broken_quantity: item.broken_quantity, location: item.location ?? "", notes: item.notes ?? "" })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.item_name) { toast.error("Item name is required"); return }
    setSaving(true)
    try {
      const body = {
        item_name: form.item_name,
        category: form.category || null,
        subject_code: form.subject_code || null,
        total_quantity: form.total_quantity,
        available_quantity: form.available_quantity,
        broken_quantity: form.broken_quantity,
        location: form.location || null,
        notes: form.notes || null,
      }
      let res: Response
      if (editingId) {
        res = await fetch(`/api/lab/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      } else {
        res = await fetch("/api/lab", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
      if (res.ok) {
        toast.success(editingId ? "Updated!" : "Added!")
        setDialogOpen(false)
        fetchItems()
      } else { toast.error("Failed to save.") }
    } catch { toast.error("Failed to save.") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return
    try {
      const res = await fetch(`/api/lab/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Deleted!"); fetchItems() }
      else { toast.error("Failed to delete.") }
    } catch { toast.error("Failed to delete.") }
  }

  const filtered = categoryFilter === "all" ? items : items.filter((i) => i.subject_code === categoryFilter || i.category === categoryFilter)

  if (!canManage) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">You do not have access to this page.</p></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lab Inventory</h1>
          <p className="text-muted-foreground">Manage physics lab equipment and supplies</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const res = await fetch("/api/lab/template")
              if (!res.ok) { toast.error("Download failed"); return }
              const blob = await res.blob()
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a"); a.href = url; a.download = "lab-inventory-template.xlsx"; a.click()
              URL.revokeObjectURL(url)
            } catch { toast.error("Download failed") }
          }}><Download className="mr-1 h-3 w-3" />Template</Button>
          <label className="cursor-pointer">
            <span className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent"><Upload className="mr-1 h-3 w-3" />Upload</span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const fd = new FormData(); fd.append("file", file)
              try {
                const res = await fetch("/api/lab/upload", { method: "POST", body: fd })
                if (res.ok) { toast.success("Uploaded!"); fetchItems() } else toast.error("Upload failed")
              } catch { toast.error("Upload failed") }
              e.target.value = ""
            }} />
          </label>
          <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" />Add Item</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equipment</CardTitle>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-sm">
              <option value="all">All Items</option>
              {allSubjects.map((s) => (<option key={s.code} value={s.code}>{s.icon} {s.name}</option>))}
              {categories.filter(c => !allSubjects.some(s => s.code === c)).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />))}</div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No equipment found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Broken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.subject_code && allSubjects.find(s => s.code === item.subject_code) ? <Badge variant="outline">{allSubjects.find(s => s.code === item.subject_code)!.icon} {item.subject_code}</Badge> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{item.category && <Badge variant="secondary">{item.category}</Badge>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.location ?? "-"}</TableCell>
                    <TableCell className="text-center">{item.total_quantity}</TableCell>
                    <TableCell className="text-center"><span className={item.available_quantity < 3 ? "text-red-500 font-medium" : ""}>{item.available_quantity}</span></TableCell>
                    <TableCell className="text-center">{item.broken_quantity}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Equipment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label>Item Name *</Label>
              <Input value={form.item_name} onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Newton Meter" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Subject</Label>
                <select value={form.subject_code} onChange={(e) => setForm((p) => ({ ...p, subject_code: e.target.value }))} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                  <option value="">No subject</option>
                  {allSubjects.map((s) => <option key={s.code} value={s.code}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="e.g. Mechanics" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="e.g. Cabinet A3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Total</Label>
                <Input type="number" value={form.total_quantity} onChange={(e) => setForm((p) => ({ ...p, total_quantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Available</Label>
                <Input type="number" value={form.available_quantity} onChange={(e) => setForm((p) => ({ ...p, available_quantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label>Broken</Label>
                <Input type="number" value={form.broken_quantity} onChange={(e) => setForm((p) => ({ ...p, broken_quantity: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Any remarks..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4" />{editingId ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
