'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeSubscription<T extends Record<string, unknown> = Record<string, unknown>>(
  channel: string,
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    const supabase = createClient()

    const subscription = supabase
      .channel(channel)
      .on<T>(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, table, callback])
}
