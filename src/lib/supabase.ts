import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  if (!url || !key || url.includes('placeholder')) {
    console.warn('[supabase] MISSING or INVALID env vars. Auth will not work.')
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL:', url ? 'SET' : 'MISSING')
    console.warn('[supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'SET' : 'MISSING')
  }

  _supabase = createClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder'
  )
  return _supabase
}

function lazy<T>(getter: () => T): T {
  let value: T | undefined
  return new Proxy({} as any, {
    get(_, prop) {
      if (!value) value = getter()
      const target = value as any
      const result = target[prop]
      if (typeof result === 'function') return result.bind(target)
      return result
    },
  }) as T
}

export const supabase = lazy<SupabaseClient>(() => getSupabaseClient())

export type Profile = {
  id: string
  email: string
  full_name?: string
  plan: 'free' | 'pro'
  created_at: string
}

export type WatchlistItem = {
  id: string
  user_id: string
  stock_code: string
  alert_score?: number
  notes?: string
  created_at: string
}
