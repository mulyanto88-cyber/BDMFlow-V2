// =============================================================================
// src/lib/ai-guardian.ts
// In-Memory Rate Limiter & Response Cache for BDMFlow AI Engine
// Prevents uncontrolled API costs, enforces token limits, and boosts speed
// =============================================================================

interface RateLimitRecord {
  count: number
  resetTime: number
}

// 1. Sliding Window Rate Limiter (Per User ID / IP)
const userRateLimits = new Map<string, RateLimitRecord>()

// Clean up expired rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of userRateLimits.entries()) {
      if (now > record.resetTime) {
        userRateLimits.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Check if a user has exceeded their rate limit
 * @param identifier User ID or IP address
 * @param maxRequests Maximum allowed requests in the window (Default: 20 req/min)
 * @param windowMs Time window in milliseconds (Default: 60,000ms = 1 min)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now()
  let record = userRateLimits.get(identifier)

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs,
    }
    userRateLimits.set(identifier, record)
    return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 }
  }

  if (record.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  record.count += 1
  return { allowed: true, remaining: maxRequests - record.count, retryAfterSeconds: 0 }
}

// 2. In-Memory Analysis Cache (TTL 10 Minutes)
interface CacheEntry {
  analysis: string
  snapshot: any
  timestamp: number
}

const analysisCache = new Map<string, CacheEntry>()

/**
 * Retrieve cached analysis for identical stock, style & date
 */
export function getCachedAnalysis(key: string, ttlMs: number = 10 * 60 * 1000): CacheEntry | null {
  const entry = analysisCache.get(key)
  if (!entry) return null

  if (Date.now() - entry.timestamp > ttlMs) {
    analysisCache.delete(key)
    return null
  }

  return entry
}

/**
 * Store analysis result in cache
 */
export function setCachedAnalysis(key: string, analysis: string, snapshot: any): void {
  analysisCache.set(key, {
    analysis,
    snapshot,
    timestamp: Date.now(),
  })
}
