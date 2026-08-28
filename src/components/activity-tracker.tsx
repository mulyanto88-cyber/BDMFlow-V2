'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { supabase } from '@/lib/supabase'

const GUEST_ID_KEY = 'bdmflow_guest_id'

function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return 'guest_anon'
  try {
    let id = localStorage.getItem(GUEST_ID_KEY)
    if (!id) {
      id = 'guest_' + Math.random().toString(36).substring(2, 10)
      localStorage.setItem(GUEST_ID_KEY, id)
    }
    return id
  } catch {
    return 'guest_anon'
  }
}

export default function ActivityTracker() {
  const pathname = usePathname()
  const { user } = useAuth()
  const lastLoggedPathRef = useRef<string | null>(null)
  const lastLoggedTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!pathname) return

    // Debounce duplicate tracking on the same path within 3 seconds
    const now = Date.now()
    if (lastLoggedPathRef.current === pathname && (now - lastLoggedTimeRef.current) < 3000) {
      return
    }

    lastLoggedPathRef.current = pathname
    lastLoggedTimeRef.current = now

    const guestId = !user ? getOrCreateGuestId() : null

    // Asynchronous silent logging to Supabase
    async function logActivity() {
      try {
        await supabase
          .from('user_activities')
          .insert({
            user_id: user?.id || null,
            guest_id: guestId,
            path: pathname,
            page_title: typeof document !== 'undefined' ? document.title : pathname,
          })
      } catch (err: any) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[ActivityTracker] Log skipped:', err?.message)
        }
      }
    }

    logActivity()
  }, [pathname, user])

  return null
}
