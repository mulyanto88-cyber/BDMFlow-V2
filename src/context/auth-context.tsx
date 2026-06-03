'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  isPro: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null, session: null, loading: true, isPro: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro]     = useState(false)

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
        if (session?.user) checkPlan(session.user.id)
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
      if (session?.user) checkPlan(session.user.id)
      else setIsPro(false)
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
        .select('plan')
        .eq('id', userId)
        .single()
      setIsPro(data?.plan === 'pro')
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

  return (
    <AuthContext.Provider value={{ user, session, loading, isPro, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
