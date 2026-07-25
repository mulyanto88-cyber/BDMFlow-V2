// ============================================================
// src/lib/auth-server.ts
// Server-side identity + plan resolution.
//
// The client can claim anything, so plan checks must happen here: we verify the
// Supabase JWT and read profiles.plan with the service-role key. Never trust an
// `isPro` flag that arrived from the browser.
// ============================================================
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export type Plan = 'free' | 'pro'

export type Viewer = {
  userId: string | null
  plan: Plan
  /** True while an authenticated user's server-side trial is still running. */
  trialActive: boolean
  /** Pro data may be served: paid, or on an active trial. */
  entitled: boolean
}

export const ANONYMOUS: Viewer = {
  userId: null,
  plan: 'free',
  trialActive: false,
  entitled: false,
}

let _admin: SupabaseClient | null = null

/** Service-role client. Returns null when env vars are absent (e.g. local dev). */
function admin(): SupabaseClient | null {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _admin = createClient(url, key, { auth: { persistSession: false } })
  return _admin
}

function bearer(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  const token = header.slice(7).trim()
  return token.length > 0 ? token : null
}

/**
 * Resolve who is calling and what they're entitled to.
 * Always resolves — an unverifiable caller is simply anonymous, never an error.
 */
export async function getViewer(req: NextRequest): Promise<Viewer> {
  const token = bearer(req)
  if (!token) return ANONYMOUS

  const sb = admin()
  if (!sb) return ANONYMOUS

  try {
    const { data, error } = await sb.auth.getUser(token)
    const user = data?.user
    if (error || !user) return ANONYMOUS

    const { data: profile } = await sb
      .from('profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    const plan: Plan = profile?.plan === 'pro' ? 'pro' : 'free'
    const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
    const trialActive = !!trialEnds && trialEnds.getTime() > Date.now()

    return {
      userId: user.id,
      plan,
      trialActive,
      entitled: plan === 'pro' || trialActive,
    }
  } catch (err) {
    console.warn('[auth-server] viewer lookup failed:', (err as Error)?.message)
    return ANONYMOUS
  }
}

/**
 * Whether paid-tier data should be withheld from this viewer.
 *
 * Enforcement is opt-in via ENFORCE_PRO_GATING so the paywall can be switched on
 * only once the plan/trial data is in place — flipping the env var is the whole
 * migration. While it's off, Pro queries stay open exactly as they are today.
 */
export function shouldBlockPro(viewer: Viewer): boolean {
  if (process.env.ENFORCE_PRO_GATING !== 'true') return false
  return !viewer.entitled
}
