import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bm9tdmNtcXNmYmtxcWp3emhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDk5OTIsImV4cCI6MjA2NDg4NTk5Mn0.vWLHVhrRqxS3uK32Pob8cBESQqJfZbyEze3Ky3JHTRw'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co') ? process.env.NEXT_PUBLIC_SUPABASE_URL : FALLBACK_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.startsWith('eyJ') ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : FALLBACK_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}
