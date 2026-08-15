'use client'

import { supabase } from '@/lib/supabase'
import type { QueryId } from '@/lib/query-registry'

const API_BASE = '/api/motherduck'
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 600

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export type MdQueryResult = Record<string, unknown>[]

/** Thrown when the server withholds paid-tier data, so callers can prompt upgrade. */
export class UpgradeRequiredError extends Error {
  readonly upgrade = true
  constructor(message = 'Fitur Pro. Silakan upgrade untuk mengakses data ini.') {
    super(message)
    this.name = 'UpgradeRequiredError'
  }
}

/** Attach the session token when signed in, so the server can resolve the plan. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) headers.Authorization = `Bearer ${token}`
  } catch {
    // Not signed in, or auth unavailable — proceed anonymously.
  }
  return headers
}

/**
 * Like fetch(), but attaches the Supabase bearer token when a session exists.
 *
 * Direct-fetch API routes (radar, broker-tracker, stock-detail, ...) resolve
 * the caller's plan server-side the same way /api/motherduck does. Pages and
 * hooks must use this wrapper so that when ENFORCE_PRO_GATING is switched on,
 * signed-in Pro users still pass the server-side gate.
 */
export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  try {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)
  } catch {
    // Not signed in, or auth unavailable — proceed anonymously.
  }
  return fetch(input, { ...init, headers })
}

/**
 * Run a named server-side query.
 *
 * The SQL lives in src/lib/query-registry.ts; callers pass its id and params.
 * Raw SQL from the browser is no longer accepted by the API.
 */
export async function mdQuery(id: QueryId, params?: unknown[]): Promise<MdQueryResult> {
  let lastErr: Error | null = null
  const headers = await authHeaders()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, params }),
        signal: AbortSignal.timeout(30000),
      })

      if (res.status === 402) {
        const json = await res.json().catch(() => ({}))
        throw new UpgradeRequiredError(json.error)
      }

      if (res.status === 429) {
        throw new Error('Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.')
      }

      const json = await res.json()
      if (json.error) throw new Error(json.error)

      return (json.data as MdQueryResult) || []
    } catch (err: unknown) {
      lastErr = err instanceof Error ? err : new Error(String(err))

      // Never retry a definitive answer from the server.
      if (lastErr instanceof UpgradeRequiredError) throw lastErr

      const retryable =
        lastErr.name === 'TimeoutError' ||
        lastErr.name === 'AbortError' ||
        lastErr.message.includes('fetch')

      if (retryable && attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1))
        continue
      }

      if (lastErr.name === 'TimeoutError' || lastErr.name === 'AbortError') {
        throw new Error('Request timeout — server sedang sibuk. Silakan coba lagi.')
      }
      if (lastErr.message.includes('fetch')) {
        throw new Error('Gangguan jaringan — periksa koneksi Anda.')
      }
      break
    }
  }

  throw lastErr ?? new Error('Unknown API error')
}
