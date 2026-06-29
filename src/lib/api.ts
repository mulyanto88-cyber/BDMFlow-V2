'use client'

const API_BASE = '/api/motherduck'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 600

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type MdQueryResult = Record<string, unknown>[]

export async function mdQuery(query: string, params?: unknown[]): Promise<MdQueryResult> {
  let lastErr: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, params }),
        signal: AbortSignal.timeout(30000),
      })

      const json = await res.json()

      if (json.error) {
        throw new Error(json.error)
      }

      return (json.data as MdQueryResult) || []
    } catch (err: unknown) {
      lastErr = err instanceof Error ? err : new Error(String(err))

      if (lastErr.name === 'TimeoutError' || lastErr.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * (attempt + 1))
          continue
        }
        throw new Error('Request timeout — server may be overloaded. Please try again.')
      }

      if (lastErr.message.includes('fetch')) {
        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY_MS * (attempt + 1))
          continue
        }
        throw new Error('Network error — check your connection.')
      }

      break
    }
  }

  throw lastErr ?? new Error('Unknown API error')
}
