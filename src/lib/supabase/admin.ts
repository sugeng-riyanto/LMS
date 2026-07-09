import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
const FALLBACK_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc2MzQ3NCwiZXhwIjoyMDk4MzM5NDc0fQ.kURnxdJms7u6G1wkbApW7D8pAXCN96J2OSjQino5YFc'

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
