import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/supabase/require-role"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ executionId: string }> }
) {
  try {
    const { supabase, error: authError } = await requireRole(["super_admin"])
    if (authError) return authError

    const { executionId } = await params

    const { data, error } = await (supabase
      .from("agent_logs") as any)
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 })
    }

    const logs = data.map((log: Record<string, unknown>) => ({
      id: log.id as string,
      execution_id: log.execution_id as string,
      agent_name: log.agent_name as string,
      grade: log.grade as number,
      status: log.status as string,
      message: log.error_message ? `Failed: ${log.error_message}` : `${log.agent_name} ${log.status}`,
      created_at: log.created_at as string,
    }))

    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
