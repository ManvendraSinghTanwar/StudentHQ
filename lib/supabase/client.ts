import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, use mock values (demo mode)
  if (!url || !key) {
    console.warn('[v0] Supabase not configured. Using demo mode.')
    return createBrowserClient('https://mock.supabase.co', 'mock-key')
  }

  return createBrowserClient(url, key)
}
