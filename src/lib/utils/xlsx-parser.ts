import type { CalendarEvent } from "../agents/agent-types"

interface ExcelWorkbook {
  worksheets: ExcelWorksheet[]
}

interface ExcelWorksheet {
  rows: ExcelRow[]
}

interface ExcelRow {
  cells: ExcelCell[]
}

interface ExcelCell {
  value?: string | number | boolean | Date
  type?: string
}

const EVENT_TYPE_MAP: Record<string, CalendarEvent["type"]> = {
  "holiday": "holiday",
  "exam": "exam",
  "tryout": "tryout",
  "mock": "mock_test",
  "mock test": "mock_test",
  "offsite": "offsite",
  "off site": "offsite",
  "blackout": "blackout",
  "pd day": "pd_day",
  "pd_day": "pd_day",
  "professional development": "pd_day",
  "normal": "normal",
  "class": "normal",
  "regular": "normal"
}

function normalizeType(raw: string): CalendarEvent["type"] {
  const key = raw.toLowerCase().trim()
  return EVENT_TYPE_MAP[key] || "normal"
}

function parseDateCell(cell: ExcelCell): string | null {
  if (!cell || cell.value === undefined || cell.value === null) return null

  if (cell.value instanceof Date) {
    return cell.value.toISOString().split("T")[0]
  }

  if (typeof cell.value === "number") {
    const excelEpoch = new Date(1899, 11, 30)
    const date = new Date(excelEpoch.getTime() + cell.value * 86400000)
    return date.toISOString().split("T")[0]
  }

  const str = String(cell.value).trim()
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = str.match(dateRegex)
  if (match) return str

  const parts = str.split(/[/\-.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    if (a > 1000) return `${a}-${String(b).padStart(2, "0")}-${String(c).padStart(2, "0")}`
    if (c > 1000) return `${c}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`
  }

  return null
}

function findColumnIndex(headerCells: ExcelCell[], ...names: string[]): number {
  for (let i = 0; i < headerCells.length; i++) {
    const val = headerCells[i]?.value
    if (val !== undefined && val !== null) {
      const str = String(val).toLowerCase().trim()
      if (names.some(n => str.includes(n))) return i
    }
  }
  return -1
}

function mapColumns(headers: ExcelCell[]): {
  date: number
  title: number
  type: number
  description: number
  grade: number
} {
  return {
    date: findColumnIndex(headers, "date", "tanggal", "tgl", "day"),
    title: findColumnIndex(headers, "title", "judul", "event", "activity", "nama", "kegiatan"),
    type: findColumnIndex(headers, "type", "tipe", "jenis", "category", "kategori"),
    description: findColumnIndex(headers, "description", "deskripsi", "desc", "note", "keterangan"),
    grade: findColumnIndex(headers, "grade", "kelas", "level", "angkatan")
  }
}

export async function parseCalendarXLSX(fileBuffer: ArrayBuffer): Promise<CalendarEvent[]> {
  let exceljs: any

  try {
    exceljs = await import("exceljs")
  } catch {
    throw new Error("exceljs is required. Install with: npm install exceljs")
  }

  const workbook = new exceljs.Workbook()
  await workbook.xlsx.load(Buffer.from(fileBuffer))

  const events: CalendarEvent[] = []
  const worksheet = workbook.worksheets[0]

  if (!worksheet) {
    throw new Error("XLSX file has no worksheets")
  }

  const rows = worksheet.getRows()
  if (!rows || rows.length === 0) {
    throw new Error("Worksheet is empty")
  }

  const headerCells: { value: any }[] = rows[0].values as any[]
  const cols = mapColumns(headerCells)

  if (cols.date === -1) {
    throw new Error("Could not find date column in XLSX. Expected headers: date, title, type")
  }

  for (let i = 1; i < rows.length; i++) {
    const cells: { value: any }[] = rows[i].values as any[]
    if (!cells || cells.length === 0) continue

    const rawDate = cells[cols.date]?.value
    const parsedDate = parseDateCell({ value: rawDate } as ExcelCell)

    if (!parsedDate) continue

    const rawTitle = cells[cols.title]?.value
    const title = rawTitle !== undefined && rawTitle !== null ? String(rawTitle).trim() : "Untitled Event"

    const event: CalendarEvent = {
      title,
      date: parsedDate,
      type: "normal"
    }

    if (cols.type !== -1) {
      const rawType = cells[cols.type]?.value
      if (rawType !== undefined && rawType !== null) {
        event.type = normalizeType(String(rawType))
      }
    }

    if (cols.description !== -1) {
      const rawDesc = cells[cols.description]?.value
      if (rawDesc !== undefined && rawDesc !== null) {
        event.description = String(rawDesc).trim()
      }
    }

    if (cols.grade !== -1) {
      const rawGrade = cells[cols.grade]?.value
      if (rawGrade !== undefined && rawGrade !== null) {
        const parsed = parseInt(String(rawGrade))
        if (!isNaN(parsed)) event.grade = parsed
      }
    }

    events.push(event)
  }

  return events
}
