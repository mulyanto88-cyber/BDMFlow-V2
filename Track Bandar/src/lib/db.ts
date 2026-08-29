import { Pool } from 'pg'
import { getCached, setCached } from './cache'
import fs from 'fs'
import path from 'path'

// Load .env.local if MOTHERDUCK_TOKEN is not in process.env yet
if (!process.env.MOTHERDUCK_TOKEN) {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8')
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
        if (match && match[1] === 'MOTHERDUCK_TOKEN') {
          let val = match[2]
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1)
          }
          process.env.MOTHERDUCK_TOKEN = val
          break
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse .env.local:', e)
  }
}

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: process.env.MOTHERDUCK_TOKEN,
  database: 'md:',
  ssl: { rejectUnauthorized: true },
  max: 4, // Strict max 4 connections to prevent flooding
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
})

export async function runQuery<T = any>(sql: string, params: any[] = [], ttlSeconds = 900): Promise<{ rows: T[]; fromCache: boolean }> {
  const cacheKey = `query:${sql}:${JSON.stringify(params)}`
  const cachedData = getCached<T[]>(cacheKey)

  if (cachedData) {
    return { rows: cachedData, fromCache: true }
  }

  const client = await pool.connect()
  try {
    const res = await client.query<any>(sql, params)
    const rows = res.rows || []
    setCached(cacheKey, rows, ttlSeconds)
    return { rows, fromCache: false }
  } finally {
    client.release()
  }
}
