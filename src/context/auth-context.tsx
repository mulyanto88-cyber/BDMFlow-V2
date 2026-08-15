'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { isPlanActive } from '@/lib/billing'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  isPro: boolean
  /** Days left on the account's server-side trial; null when there is none. */
  trialDaysLeft: number | null
  /** Paid, or still inside the trial window — mirrors the server's entitlement. */
  entitled: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthState>({
  user: null, session: null, loading: true, isPro: false,
  trialDaysLeft: null, entitled: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  signInWithGoogle: async () => ({ error: null }),
})

/**
 * Funnel event: a verified account just became visible to us.
 * Fired at most once per user per browser (localStorage flag) so page
 * revisits don't inflate the signup_verified count in analytics.
 */
function trackVerifiedOnce(user: User) {
  if (!user.email_confirmed_at) return
  try {
    const key = `bdmflow_verified:${user.id}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    track('signup_verified', { provider: String(user.app_metadata?.provider ?? 'email') })
  } catch {
    // localStorage unavailable (private mode) — skip, never break auth.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro]     = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  // null = not yet resolved; the first resolution just records state, so
  // 'plan_activated' fires only on a real free → active-Pro transition
  // (i.e. the moment a payment's webhook lands and the UI reloads).
  const wasPlanActiveRef = useRef<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (cancelled) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          trackVerifiedOnce(session.user)
          checkPlan(session.user.id)
        }
      })
      .catch((err) => {
        console.warn('[auth] getSession failed:', err?.message)
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeout)
          setLoading(false)
        }
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        trackVerifiedOnce(session.user)
        checkPlan(session.user.id)
      }
      else { setIsPro(false); setTrialDaysLeft(null) }
    })

    return () => {
      cancelled = true
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [])

  async function checkPlan(userId: string) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('plan, trial_ends_at, plan_expires_at')
        .eq('id', userId)
        .single()

      // plan='pro' only counts while the window is unexpired (NULL expiry =
      // legacy manual grant, still active). Mirrors src/lib/auth-server.ts.
      const planActive = isPlanActive(data?.plan, data?.plan_expires_at)
      if (wasPlanActiveRef.current === false && planActive) {
        track('plan_activated')
      }
      wasPlanActiveRef.current = planActive
      setIsPro(planActive)

      // trial_ends_at may be absent until migration 001 has been applied.
      const ends = data?.trial_ends_at ? new Date(data.trial_ends_at).getTime() : null
      setTrialDaysLeft(
        ends && ends > Date.now() ? Math.ceil((ends - Date.now()) / 86400000) : null,
      )
    } catch (err) {
      console.warn('[auth] checkPlan failed:', (err as Error)?.message)
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message ?? null }
    } catch (err: any) {
      return { error: err?.message || 'Gagal masuk. Periksa koneksi dan coba lagi.' }
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${origin}/auth`,
        },
      })
      return { error: error?.message ?? null }
    } catch (err: any) {
      return { error: err?.message || 'Gagal daftar. Periksa koneksi dan coba lagi.' }
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[auth] signOut failed:', (err as Error)?.message)
    }
    setIsPro(false)
  }

  async function signInWithGoogle() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${origin}/auth` },
      })
      return { error: error?.message ?? null }
    } catch (err: any) {
      return { error: err?.message || 'Gagal masuk dengan Google.' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, isPro,
      trialDaysLeft,
      entitled: isPro || (trialDaysLeft ?? 0) > 0,
      signIn, signUp, signOut, signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
