import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/supabase/require-role"
import * as XLSX from "exceljs"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const adminClient = createAdminClient()
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const workbook = new XLSX.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer() as any)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return NextResponse.json({ error: "No worksheet found in file" }, { status: 400 })
    }

    const rows: Array<{
      academic_year: string
      semester: number
      month: number
      week_number: number
      start_date: string
      end_date: string
      effective_days: number
      event_name: string | null
      event_type: string
      affected_grades: number[]
      is_holiday: boolean
    }> = []

    const eventTypeMap: Record<string, string> = {
      normal: "normal",
      holiday: "holiday",
      exam: "exam",
      tryout: "tryout",
      mock_test: "mock_test",
      offsite: "offsite",
      blackout: "blackout",
      pd_day: "pd_day",
    }

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const values = row.values as Record<number, unknown>
      const getVal = (index: number): string | undefined =>
        values[index]?.toString()?.trim() || undefined

      const academicYear = getVal(1)
      const semester = getVal(2)
      const month = getVal(3)
      const weekNumber = getVal(4)
      const startDate = getVal(5)
      const endDate = getVal(6)
      const effectiveDays = getVal(7)
      const eventName = getVal(8)
      const eventType = getVal(9)
      const affectedGradesRaw = getVal(10)
      const isHolidayRaw = getVal(11)

      if (!academicYear || !semester || !weekNumber || !startDate) return

      const affectedGrades = affectedGradesRaw
        ? affectedGradesRaw.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
        : []

      rows.push({
        academic_year: academicYear,
        semester: parseInt(semester),
        month: month ? parseInt(month) : 1,
        week_number: parseInt(weekNumber),
        start_date: startDate,
        end_date: endDate || startDate,
        effective_days: effectiveDays ? parseInt(effectiveDays) : 0,
        event_name: eventName ?? null,
        event_type: eventType ? (eventTypeMap[eventType.toLowerCase()] ?? "normal") : "normal",
        affected_grades: affectedGrades,
        is_holiday: isHolidayRaw ? isHolidayRaw.toLowerCase() === "yes" || isHolidayRaw === "1" : false,
      })
    })

    if (rows.length === 0) {
      return NextResponse.json({ error: "No valid rows found in file" }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from("academic_calendars")
      .insert(rows as any)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully inserted ${data.length} calendar entries`,
      count: data.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
