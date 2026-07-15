"use client"

import { useState, useMemo } from "react"

interface Column<T> {
  key: string
  label: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface Props<T> {
  data: T[]
  columns: Column<T>[]
  searchFields?: string[]
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

export function SortableTable<T extends Record<string, any>>({ data, columns, searchFields, searchPlaceholder, pageSize = 50, onRowClick, actions }: Props<T>) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState(columns[0]?.key || "")
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    let items = [...data]
    if (search && searchFields && searchFields.length > 0) {
      const q = search.toLowerCase()
      items = items.filter(item => searchFields.some(f => String(item[f] || "").toLowerCase().includes(q)))
    }
    if (sortField) {
      items.sort((a, b) => {
        const aVal = String(a[sortField] || "")
        const bVal = String(b[sortField] || "")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    }
    return items
  }, [data, search, sortField, sortAsc, searchFields])

  return (
    <div className="space-y-2">
      {searchFields && searchFields.length > 0 && (
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder || "Search..."}
          className="h-8 rounded border border-input bg-background px-2 text-sm w-64" />
      )}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map(col => (
                <th key={col.key} className={`px-3 py-2 text-left font-medium text-xs uppercase tracking-wider ${col.sortable !== false ? "cursor-pointer select-none hover:bg-muted" : ""}`}
                  onClick={() => {
                    if (col.sortable === false) return
                    if (sortField === col.key) setSortAsc(!sortAsc)
                    else { setSortField(col.key); setSortAsc(true) }
                  }}>
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key ? (sortAsc ? "▲" : "▼") : ""}
                  </span>
                </th>
              ))}
              {actions && <th className="px-3 py-2 text-right font-medium text-xs uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-3 py-8 text-center text-muted-foreground">No data</td></tr>
            ) : filtered.slice(0, pageSize).map((item, i) => (
              <tr key={item.id || i} className={`border-b last:border-0 hover:bg-accent/50 ${onRowClick ? "cursor-pointer" : ""}`}
                onClick={() => onRowClick?.(item)}>
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-2">
                    {col.render ? col.render(item) : String(item[col.key] ?? "-")}
                  </td>
                ))}
                {actions && <td className="px-3 py-2 text-right">{actions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > pageSize && (
        <p className="text-xs text-muted-foreground">Showing {pageSize} of {filtered.length} results</p>
      )}
    </div>
  )
}
