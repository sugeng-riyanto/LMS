import { NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "xlsx"

export async function GET() {
  try {
    const { error: authError } = await requireRole(["super_admin", "lab_assistant"])
    if (authError) return authError

    const wb = XLSX.utils.book_new()
    const data = [
      { item_name: "", category: "Mechanics", total_quantity: 10, available_quantity: 8, broken_quantity: 2, location: "Cabinet A3", notes: "" },
    ]
    const ws = XLSX.utils.json_to_sheet(data)
    const notes = [
      ["INSTRUCTIONS:"],
      ["item_name", "Item name (required)"],
      ["category", "Category (e.g. Mechanics, Electricity, Waves, Thermal, General)"],
      ["total_quantity", "Total number in stock"],
      ["available_quantity", "Currently available"],
      ["broken_quantity", "Number damaged"],
      ["location", "Storage location"],
      ["notes", "Any remarks"],
    ]
    XLSX.utils.sheet_add_aoa(ws, notes, { origin: "A4" })
    ws["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, ws, "Lab Inventory")

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="lab-inventory-template.xlsx"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
