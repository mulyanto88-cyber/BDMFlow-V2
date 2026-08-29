import NodeCache from 'node-cache'

// Global cache instance with 15 minutes default TTL (900 seconds)
// This prevents hitting MotherDuck DB repeatedly for identical requests
const globalCache = new NodeCache({ stdTTL: 900, checkperiod: 120 })

export function getCached<T>(key: string): T | undefined {
  return globalCache.get<T>(key)
}

export function setCached<T>(key: string, value: T, ttlSeconds?: number): boolean {
  if (ttlSeconds !== undefined) {
    return globalCache.set(key, value, ttlSeconds)
  }
  return globalCache.set(key, value)
}

export function getCacheStats() {
  return globalCache.getStats()
}
