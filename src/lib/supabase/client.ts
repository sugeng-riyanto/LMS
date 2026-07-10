import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjM0NzQsImV4cCI6MjA5ODMzOTQ3NH0.QBpmyNnEFxzMXoxEjQY16cOYNUUbK0I3oUU0GwjJBX0'

export function createClient() {
  return createBrowserClient(FALLBACK_URL, FALLBACK_ANON_KEY)
}
