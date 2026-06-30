'use client'

import { useMutation, useQuery } from '@tanstack/react-query'

interface AgentLog {
  id: string
  execution_id: string
  grade: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  message: string
  created_at: string
}

async function triggerAgentGeneration(grade?: number): Promise<{ execution_id: string }> {
  const res = await fetch('/api/agents/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade }),
  })
  if (!res.ok) throw new Error('Failed to trigger agent generation')
  return res.json()
}

async function fetchAgentLogs(executionId: string): Promise<AgentLog[]> {
  const res = await fetch(`/api/agents/logs/${executionId}`)
  if (!res.ok) throw new Error('Failed to fetch agent logs')
  return res.json()
}

export function useTriggerAgentGeneration(grade?: number) {
  return useMutation({
    mutationFn: () => triggerAgentGeneration(grade),
    mutationKey: ['trigger-agent', grade],
  })
}

export function useAgentLogs(executionId: string) {
  return useQuery({
    queryKey: ['agent-logs', executionId],
    queryFn: () => fetchAgentLogs(executionId),
    enabled: !!executionId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return 3000
      const hasRunning = data.some((log) => log.status === 'pending' || log.status === 'running')
      return hasRunning ? 3000 : false
    },
  })
}
