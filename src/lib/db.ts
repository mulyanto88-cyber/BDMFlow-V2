// ============================================================
// src/lib/db.ts
// ============================================================
import { Pool, PoolClient, QueryResultRow } from 'pg'
import { createHash } from 'crypto'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: process.env.MOTHERDUCK_TOKEN,
  database: 'md:',
  ssl: { rejectUnauthorized: true },
  max: 8,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  keepAlive: true,
})

pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message)
})

const queryCache = new Map<string, { data: any; expires: number }>()
const activeQueries = new Map<string, Promise<any>>()

export async function run<T extends QueryResultRow = any>(
  query: string,
  params: any[] = [],
  ttlMs: number = 60000 // Default 60s cache
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
        const result = await client.query<T>(query, params)
        if (ttlMs > 0) {
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
