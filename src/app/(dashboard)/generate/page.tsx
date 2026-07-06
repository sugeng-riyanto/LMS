"use client"

import { useState } from "react"
import { useRBAC } from "@/hooks/use-rbac"
import { useTriggerAgentGeneration, useAgentLogs } from "@/hooks/use-agents"
import { GRADES, GRADE_LABELS } from "@/lib/utils/constants"
import toast from "react-hot-toast"
import {
  Loader2,
  BrainCircuit,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils/cn"

const statusIcon: Record<string, React.ElementType> = {
  completed: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  pending: Clock,
}

const statusColor: Record<string, string> = {
  completed: "text-green-500",
  failed: "text-red-500",
  running: "text-primary",
  pending: "text-muted-foreground",
}

export default function GeneratePage() {
  const { canManagePackages } = useRBAC()
  const [grade, setGrade] = useState<number | undefined>(undefined)
  const [executionId, setExecutionId] = useState<string | null>(null)
  const { mutateAsync: triggerGeneration, isPending } = useTriggerAgentGeneration(grade)
  const { data: logs, isLoading: logsLoading } = useAgentLogs(executionId ?? "")

  async function handleGenerate() {
    try {
      setExecutionId(null)
      const result = await triggerGeneration()
      setExecutionId(result.execution_id)
      toast.success("Agent generation started!")
    } catch {
      toast.error("Failed to start agent generation.")
    }
  }

  const hasActiveLogs = logs?.some(
    (l) => l.status === "pending" || l.status === "running",
  )

  if (!canManagePackages) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Generate Packages</h1>
        <p className="text-muted-foreground">
          Generate weekly teaching packages using AI. Select a grade to automatically produce lesson plans, worksheets, pre-class materials, lab logistics, and answer keys aligned to the Cambridge curriculum.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium" htmlFor="grade-select">
              Target Grade
            </label>
            <select
              id="grade-select"
              value={grade ?? "all"}
              onChange={(e) => setGrade(e.target.value === "all" ? undefined : Number(e.target.value))}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64"
            >
              <option value="all">All Grades</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {GRADE_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPending ? "Starting..." : "Generate Weekly Packages"}
          </button>
        </div>
      </div>

      {executionId && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Agent Execution Logs</h2>
            {hasActiveLogs && (
              <span className="ml-auto flex items-center gap-1 text-sm text-primary">
                <RefreshCw className="h-3 w-3 animate-spin" /> Running
              </span>
            )}
          </div>
          {logsLoading && !logs ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = statusIcon[log.status] ?? Clock
                const color = statusColor[log.status] ?? "text-muted-foreground"

                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-sm",
                      log.status === "failed" && "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
                      log.status === "completed" && "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-950/20",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", color)} />
                    <div className="flex-1">
                      <p className="font-medium capitalize">{log.message}</p>
                      {log.grade && (
                        <p className="text-xs text-muted-foreground">
                          Grade {log.grade} &middot;{" "}
                          {new Date(log.created_at).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <span className={cn("text-xs font-medium capitalize", color)}>
                      {log.status}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for logs...</p>
          )}
        </div>
      )}

      {!executionId && (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center shadow-sm">
          <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Ready to generate</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a grade above and click &ldquo;Generate Weekly Packages&rdquo; to start the AI agents.
          </p>
        </div>
      )}
    </div>
  )
}
