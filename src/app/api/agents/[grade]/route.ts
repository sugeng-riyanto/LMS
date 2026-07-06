import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/supabase/require-role"
import { v4 as uuidv4 } from "uuid"
import { GRADES } from "@/lib/utils/constants"
import { orchestrateWeeklyGeneration } from "@/lib/agents"
import { getCurrentWeek, getAcademicYear, getSemester, getWeekDateRange, getEffectiveDays } from "@/lib/utils/week-calculator"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ grade: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin", "teacher"])
    if (authError) return authError

    const { grade } = await params
    const gradeNum = parseInt(grade)

    if (!GRADES.includes(gradeNum as (typeof GRADES)[number])) {
      return NextResponse.json({ error: `Grade ${grade} is not valid` }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const executionId = uuidv4()

    const response = NextResponse.json({
      execution_id: executionId,
      message: `Generation started for Grade ${gradeNum}`,
      grade: gradeNum,
    })

    runSingleOrchestration(executionId, gradeNum, body).catch(console.error)

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

async function runSingleOrchestration(executionId: string, grade: number, _body: Record<string, unknown>) {
  const supabase = await createServerSupabaseClient()
  const logsTable = supabase.from("agent_logs") as any
  const packagesTable = supabase.from("weekly_packages") as any
  const weekNumber = getCurrentWeek()

  try {
    await logsTable.insert({
      execution_id: executionId,
      agent_name: "OrchestratorAgent",
      grade,
      week_number: weekNumber,
      status: "running",
      input_data: { grade },
    })

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
    await logsTable.update({
      status: "failed",
      error_message: error instanceof Error ? error.message : "Unknown error",
    }).match({ execution_id: executionId, agent_name: "OrchestratorAgent", grade })
  }
}
