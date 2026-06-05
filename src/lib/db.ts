// ============================================================
// src/lib/db.ts
// ============================================================
import { Pool, PoolClient, QueryResultRow } from 'pg'
import { createHash } from 'crypto'

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 600

// ── Fast-fail: token harus ada sebelum pool dibuat ───────────
const MOTHERDUCK_TOKEN = process.env.MOTHERDUCK_TOKEN
if (!MOTHERDUCK_TOKEN) {
  console.error(
    '[db] MOTHERDUCK_TOKEN tidak ditemukan di environment variables.\n' +
    '     Buat file .env.local dan isi:\n' +
    '     MOTHERDUCK_TOKEN=your_token_here'
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// SSL: strict di production, relaxed di dev (hindari CA-bundle issue di Windows)
const sslConfig =
  process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : { rejectUnauthorized: false }

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: MOTHERDUCK_TOKEN,
  database: 'md:',
  ssl: sslConfig,
  max: 10,                              // Increased from 8 to 10 for better parallelism
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 8000,
  query_timeout: 25000,
  statement_timeout: 25000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
})

pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message)
})

const queryCache = new Map<string, { data: any; expires: number }>()
const activeQueries = new Map<string, Promise<any>>()
const MAX_CACHE_SIZE = 200

export async function run<T extends QueryResultRow = any>(
  query: string,
  params: any[] = [],
  ttlMs: number = 60000
): Promise<T[]> {
  const hash = createHash('md5').update(query + JSON.stringify(params)).digest('hex')

  const cached = queryCache.get(hash)
  if (cached && cached.expires > Date.now()) {
    return cached.data as T[]
  }

  if (activeQueries.has(hash)) {
    return activeQueries.get(hash) as Promise<T[]>
  }

  const promise = (async () => {
    let lastErr: Error | null = null
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let client: PoolClient | null = null
      try {
        client = await pool.connect()
        const startMs = Date.now()
        const result = await client.query<T>(query, params)
        const elapsed = Date.now() - startMs
        if (elapsed > 5000) {
          console.warn(`[db] Slow query (${elapsed}ms): ${query.substring(0, 150)}`)
        }
        if (ttlMs > 0) {
          if (queryCache.size >= MAX_CACHE_SIZE) {
            const oldest = queryCache.keys().next().value
            if (oldest) queryCache.delete(oldest)
          }
          queryCache.set(hash, { data: result.rows, expires: Date.now() + ttlMs })
        }
        return result.rows
      } catch (err: any) {
        lastErr = err
        const isRetryable =
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.code === '57P01' ||
          err.code === '08006' ||
          err.code === '08001' ||
          err.message?.includes('timeout') ||
          err.message?.includes('Connection terminated')

        if (attempt < MAX_RETRIES && isRetryable) {
          console.warn(`[db] Retry ${attempt}/${MAX_RETRIES} after: ${err.message}`)
          await delay(RETRY_DELAY_MS * attempt)
          continue
        }
        throw err
      } finally {
        client?.release()
      }
    }
    throw lastErr ?? new Error('Unknown database error')
  })()

  activeQueries.set(hash, promise)
  try {
    return await promise
  } finally {
    activeQueries.delete(hash)
  }
}

export async function raw<T extends QueryResultRow = any>(
  query: string,
  params: any[] = [],
): Promise<{ rows: T[]; rowCount: number }> {
  const client = await pool.connect()
  try {
    const result = await client.query<T>(query, params)
    return { rows: result.rows, rowCount: result.rowCount ?? 0 }
  } finally {
    client.release()
  }
}

export async function closePool() {
  await pool.end()
}
