// ============================================================
// src/lib/guard.ts
// Shared request guard for market-data GET routes.
//
// Combines the two protections that used to live only in
// /api/motherduck:
//   1. Rate limiting — in-process fixed-window (see rate-limit.ts),
//      zero external store, zero database cost.
//   2. Pro gating — only resolved when ENFORCE_PRO_GATING === 'true'.
//      While the flag is off (default), getViewer() is skipped entirely,
//      so these routes cost nothing extra (no Supabase round-trip).
//
// Guards return responses with `Cache-Control: private, no-store` so a
// 402/429 can never be cached by the edge and replayed to someone else.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { getViewer, shouldBlockPro } from '@/lib/auth-server'
import { rateLimit, clientKey } from '@/lib/rate-limit'

const DEFAULT_LIMIT = 300  // requests
const WINDOW_MS = 60_000   // per minute

export type GuardOptions = {
  /** Route serves paid-tier data (default true — fail closed). */
  pro?: boolean
  /** Per-client request budget per minute (default 300). */
  limit?: number
}

/**
 * Run the standard guards. Returns null when the request may proceed,
 * or a ready-to-return 429/402 response.
 */
export async function guardApi(
  req: NextRequest,
  opts: GuardOptions = {},
): Promise<NextResponse | null> {
  const enforcePro = process.env.ENFORCE_PRO_GATING === 'true'

  // Only resolve identity when the paywall is actually on — otherwise this
  // is a pure in-memory check.
  const viewer = enforcePro ? await getViewer(req) : null

  const rl = rateLimit(clientKey(req, viewer?.userId ?? null), opts.limit ?? DEFAULT_LIMIT, WINDOW_MS)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter), 'Cache-Control': 'private, no-store' } },
    )
  }

  if (opts.pro !== false && enforcePro && viewer && shouldBlockPro(viewer)) {
    return NextResponse.json(
      { error: 'Fitur Pro. Silakan upgrade untuk mengakses data ini.', upgrade: true },
      { status: 402, headers: { 'Cache-Control': 'private, no-store' } },
    )
  }

  return null
}
