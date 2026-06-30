'use client'

import { useQuery } from '@tanstack/react-query'
import type { CalendarEvent } from '@/types/calendar'

interface CalendarFilters {
  grade?: number
  week?: number
}

async function fetchCalendarEvents(filters?: CalendarFilters): Promise<CalendarEvent[]> {
  const params = new URLSearchParams()
  if (filters?.grade) params.set('grade', String(filters.grade))
  if (filters?.week) params.set('week', String(filters.week))
  const qs = params.toString()
  const res = await fetch(`/api/calendar${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch calendar events')
  return res.json()
}

export function useCalendarEvents(filters?: CalendarFilters) {
  return useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: () => fetchCalendarEvents(filters),
  })
}
