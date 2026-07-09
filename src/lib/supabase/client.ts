import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDk5OTIsImV4cCI6MjA2NDg4NTk5Mn0.vWLHVhrRqxS3uK32Pob8cBESQqJfZbyEze3Ky3JHTRw'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY
  )
}
