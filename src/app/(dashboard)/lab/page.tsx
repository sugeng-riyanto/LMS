"use client"

import { useState, useEffect } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PackageSearch, Save, Search } from "lucide-react"
import toast from "react-hot-toast"

interface LabItem {
  id: string
  item_name: string
  category: string | null
  total_quantity: number
  available_quantity: number
  broken_quantity: number
  location: string | null
  notes: string | null
}

export default function LabPage() {
  const { isSuperAdmin, isLabAssistant } = useRBAC()
  const canManage = isSuperAdmin || isLabAssistant
  const [items, setItems] = useState<LabItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [editingQty, setEditingQty] = useState<Record<string, { total: number; available: number; broken: number }>>({})

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch("/api/lab/inventory")
      if (res.ok) {
        const data: LabItem[] = await res.json()
        setItems(data)
        const cats = [...new Set(data.map((i) => i.category).filter(Boolean))] as string[]
        setCategories(cats)
      }
    } catch {
      toast.error("Failed to load inventory.")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(item: LabItem) {
    setEditingQty((prev) => ({
      ...prev,
      [item.id]: {
        total: item.total_quantity,
        available: item.available_quantity,
        broken: item.broken_quantity,
      },
    }))
  }

  function updateQty(id: string, field: "total" | "available" | "broken", value: number) {
    setEditingQty((prev) => {
      const current = prev[id]
      if (!current) return prev
      return { ...prev, [id]: { ...current, [field]: value } }
    })
  }

  async function handleSaveQty(id: string) {
    const qty = editingQty[id]
    if (!qty) return
    try {
      const res = await fetch(`/api/lab/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_quantity: qty.total,
          available_quantity: qty.available,
          broken_quantity: qty.broken,
        }),
      })
      if (res.ok) {
        toast.success("Inventory updated!")
        setEditingQty((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        fetchItems()
      } else {
        toast.error("Failed to update.")
      }
    } catch {
      toast.error("Failed to update.")
    }
  }

  const filteredItems =
    categoryFilter === "all"
      ? items
      : items.filter((i) => i.category === categoryFilter)

  const showQtyEditor = (item: LabItem) => editingQty[item.id] !== undefined

  if (!canManage) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lab Inventory</h1>
        <p className="text-muted-foreground">Manage physics lab equipment and supplies</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Equipment</CardTitle>
            <div className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No equipment found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Broken</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>
                      {item.category && (
                        <Badge variant="secondary">{item.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.location ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {showQtyEditor(item) ? (
                        <Input
                          type="number"
                          value={editingQty[item.id].total}
                          onChange={(e) => updateQty(item.id, "total", Number(e.target.value))}
                          className="h-8 w-20 text-center"
                        />
                      ) : (
                        item.total_quantity
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {showQtyEditor(item) ? (
                        <Input
                          type="number"
                          value={editingQty[item.id].available}
                          onChange={(e) => updateQty(item.id, "available", Number(e.target.value))}
                          className="h-8 w-20 text-center"
                        />
                      ) : (
                        <span className={item.available_quantity < 3 ? "text-red-500 font-medium" : ""}>
                          {item.available_quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {showQtyEditor(item) ? (
                        <Input
                          type="number"
                          value={editingQty[item.id].broken}
                          onChange={(e) => updateQty(item.id, "broken", Number(e.target.value))}
                          className="h-8 w-20 text-center"
                        />
                      ) : (
                        item.broken_quantity
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {showQtyEditor(item) ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" onClick={() => handleSaveQty(item.id)}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setEditingQty((prev) => {
                                const next = { ...prev }
                                delete next[item.id]
                                return next
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                          Update Qty
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
