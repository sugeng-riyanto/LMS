import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "lab_assistant"])
    if (authError) return authError

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return NextResponse.json({ error: "No sheet found" }, { status: 400 })

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" })
    let created = 0, failed = 0

    for (const row of rows) {
      if (!row.item_name) continue
      try {
        const { error } = await (supabase.from("lab_inventory") as any).insert({
          item_name: row.item_name,
          category: row.category || null,
          total_quantity: parseInt(row.total_quantity) || 0,
          available_quantity: parseInt(row.available_quantity) || 0,
          broken_quantity: parseInt(row.broken_quantity) || 0,
          location: row.location || null,
          notes: row.notes || null,
        })
        if (error) failed++
        else created++
      } catch { failed++ }
    }

    return NextResponse.json({ message: `${created} items created, ${failed} failed` })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
