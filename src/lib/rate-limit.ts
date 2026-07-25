// ============================================================
// src/lib/rate-limit.ts
// Fixed-window rate limiter, in-process.
//
// SCOPE: counters live in this process's memory, so on serverless each instance
// limits independently and a limit of N becomes N-per-instance. That is enough
// to stop a single client hammering the data endpoints and running up MotherDuck
// cost; it is not a distributed quota. Move to Upstash/Redis if you need exact
// global limits.
// ============================================================

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
let lastSweep = Date.now()

/** Drop expired buckets so the map can't grow without bound. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  /** Seconds until the window resets — send as Retry-After when blocked. */
  retryAfter: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, limit, remaining: limit - 1, retryAfter: 0 }
  }

  existing.count++
  const remaining = Math.max(0, limit - existing.count)
  return {
    ok: existing.count <= limit,
    limit,
    remaining,
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  }
}

/**
 * Best-effort client identity for limiting. Prefers the authenticated user so a
 * shared office IP isn't throttled as one caller; falls back to proxy headers.
 */
export function clientKey(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`
  const fwd = req.headers.get('x-forwarded-for')
  const ip =
    fwd?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  return `ip:${ip}`
}
