import { createBrowserClient } from '@supabase/ssr'

const FALLBACK_URL = 'https://yvnomvcmqsfbkqqjwzhi.supabase.co'
const FALLBACK_ANON_KEY = 'sb_publishable_MoqvJYWgKhyM1t1uAcC4iQ_w41BiKs4'

export function createClient() {
  return createBrowserClient(FALLBACK_URL, FALLBACK_ANON_KEY)
}
