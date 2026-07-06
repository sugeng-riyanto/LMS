import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"
import { v4 as uuidv4 } from "uuid"
import { GRADES } from "@/lib/utils/constants"
import { orchestrateWeeklyGeneration } from "@/lib/agents"
import { getCurrentWeek, getAcademicYear, getSemester, getWeekDateRange, getEffectiveDays } from "@/lib/utils/week-calculator"

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const supabase = await createServerSupabaseClient()
    const body = await request.json().catch(() => ({}))
    const specificGrade = body.grade ? parseInt(body.grade) : null
    const executionId = uuidv4()

    const grades = specificGrade
      ? GRADES.filter((g) => g === specificGrade)
      : [...GRADES]

    if (specificGrade && !grades.length) {
      return NextResponse.json({ error: `Grade ${specificGrade} is not valid` }, { status: 400 })
    }

    const response = NextResponse.json({
      execution_id: executionId,
      message: specificGrade
        ? `Generation started for Grade ${specificGrade}`
        : "Generation started for all grades",
      grades: grades.map((g) => ({ grade: g, status: "started" })),
    })

    runOrchestration(supabase, executionId, grades, body).catch(console.error)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function runOrchestration(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  executionId: string,
  grades: number[],
  body: Record<string, unknown>
) {
  const now = new Date()
  const weekNumber = getCurrentWeek(now)

  for (const grade of grades) {
    try {
      const logsTable = supabase.from("agent_logs") as any
      const packagesTable = supabase.from("weekly_packages") as any

      await logsTable.update({
        status: "running",
        week_number: weekNumber,
      }).match({ execution_id: executionId, grade })

      const result = await orchestrateWeeklyGeneration(grade)

      const subAgents = ["lesson_plan", "worksheet", "flipped_curator", "logistics", "broadcast"]
      const agentLogs = subAgents.map((name: string) => ({
        execution_id: executionId,
        agent_name: name,
        grade,
        week_number: weekNumber,
        status: "completed",
        input_data: { topic: result.topic, grade },
        output_data: result[name === "lesson_plan" ? "lesson_plan" : name === "worksheet" ? "worksheet" : name === "flipped_curator" ? "pre_class" : name === "logistics" ? "lab_logistics" : "broadcast" as keyof typeof result],
      }))
      await logsTable.insert(agentLogs)

      const { start, end } = getWeekDateRange(weekNumber)
      const syllabusRef: Record<number, string> = {
        7: "0893 Stage 7", 8: "0893 Stage 8/9", 9: "0625 (Half)",
        10: "0625 (Full)", 11: "9702 AS", 12: "9702 A2 + TKA"
      }

      const { error: saveError } = await packagesTable.upsert({
        academic_year: getAcademicYear(),
        grade,
        week_number: weekNumber,
        semester: getSemester(weekNumber),
        date_range_start: start.toISOString().split("T")[0],
        date_range_end: end.toISOString().split("T")[0],
        topic: result.topic,
        syllabus_ref: syllabusRef[grade] || "0625 (Full)",
        calendar_status: result.calendar_status,
        effective_days: getEffectiveDays(weekNumber),
        lesson_plan: result.lesson_plan,
        worksheet: result.worksheet,
        pre_class: result.pre_class,
        lab_logistics: result.lab_logistics,
        answer_keys: result.answer_keys,
        wa_blast: result.broadcast.wa_message,
        subject: "PHY",
        status: "pending_review",
      }, { onConflict: "academic_year, grade, week_number" })

      await logsTable.update({
        status: saveError ? "failed" : "completed",
        error_message: saveError?.message || null,
      }).match({ execution_id: executionId, agent_name: "OrchestratorAgent", grade })

    } catch (error) {
      const logsTable = supabase.from("agent_logs") as any
      await logsTable.update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      }).match({ execution_id: executionId, agent_name: "OrchestratorAgent", grade })
    }
  }
}
