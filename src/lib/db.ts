// ============================================================
// src/lib/db.ts
// Database Connection Pool (Tanpa In-Memory Map Cache)
// ============================================================
import { Pool, PoolClient, QueryResultRow } from 'pg'

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

// Hapus queryCache dan activeQueries berbasis Map
// Caching akan diserahkan ke Next.js Data Cache atau layer infrastruktur lain.

export async function run<T extends QueryResultRow = any>(
  query: string,
  params: any[] = [],
): Promise<T[]> {
  let lastErr: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let client: PoolClient | null = null
    try {
      client = await pool.connect()
      const result = await client.query<T>(query, params)
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
      if (client) {
        client.release()
      }
    }
  }
  throw lastErr ?? new Error('Unknown database error')
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
