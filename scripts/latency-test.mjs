// Measure round-trip latency to MotherDuck vs Supabase, using the same `pg`
// driver the app uses so the numbers reflect the real request path.
//
// This is the experiment the Supabase migration hinges on. The case for moving
// rests mainly on distance: MotherDuck is reached at us-east-1 (Virginia) while
// Supabase can sit in Singapore. Compute was already measured as cheap — it is
// latency that dominates, and stock-detail pays it fourteen times per page.
//
// If Supabase is not decisively faster here, the strongest argument for the
// migration collapses and staying on MotherDuck Lite is the better call.
//
//   node scripts/latency-test.mjs
//
// Reads MOTHERDUCK_TOKEN and (optionally) SUPABASE_DB_URL from .env.local.
// Supabase is skipped, not faked, when the URL is absent.

import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { Client } = require('pg')

const ROOT = path.resolve(import.meta.dirname, '..')
const ROUNDS = 20
// stock-detail issues 14 queries per page load; that burst, not a single
// round trip, is what a user actually waits for.
const BURST = 14

function loadEnv() {
  const out = {}
  let text
  try {
    text = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
  } catch {
    console.error('[fatal] .env.local not found')
    process.exit(1)
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (!m) continue
    let v = m[2]
    if (v.length >= 2 && v[0] === v.at(-1) && (v[0] === '"' || v[0] === "'")) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

const stats = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  const at = (p) => s[Math.min(s.length - 1, Math.floor(s.length * p))]
  return { min: s[0], median: at(0.5), p95: at(0.95), max: s.at(-1) }
}

async function measure(label, config) {
  const client = new Client(config)

  const t0 = performance.now()
  try {
    await client.connect()
  } catch (e) {
    console.log(`\n  ${label}: connection failed — ${e.message.slice(0, 90)}`)
    return null
  }
  const connectMs = performance.now() - t0

  // Warm up once so the first sample does not carry TLS/session setup.
  await client.query('SELECT 1')

  const samples = []
  for (let i = 0; i < ROUNDS; i++) {
    const t = performance.now()
    await client.query('SELECT 1')
    samples.push(performance.now() - t)
  }

  const tb = performance.now()
  for (let i = 0; i < BURST; i++) await client.query('SELECT 1')
  const burstMs = performance.now() - tb

  await client.end()

  // Same burst issued concurrently. Distance is paid once instead of fourteen
  // times, so the gap between these two numbers is what better batching could
  // win without moving anything — worth knowing before spending a migration on
  // the problem. A single client serialises on the wire, so this is measured on
  // a pool sized to the burst.
  const { Pool } = require('pg')
  const pool = new Pool({ ...config, max: BURST })
  // Warm every connection first. Timing an unwarmed pool measures 13 cold
  // handshakes at ~2s each, not query latency — which is how the first version
  // of this test reported a "parallel" figure that was really connection setup.
  await Promise.all(Array.from({ length: BURST }, () => pool.query('SELECT 1')))
  const tp = performance.now()
  await Promise.all(Array.from({ length: BURST }, () => pool.query('SELECT 1')))
  const parallelMs = performance.now() - tp
  await pool.end()

  const s = stats(samples)
  console.log(`\n  ${label}`)
  console.log(`    cold connect        ${connectMs.toFixed(0)} ms`)
  console.log(`    round trip  median  ${s.median.toFixed(1)} ms   p95 ${s.p95.toFixed(1)} ms   min ${s.min.toFixed(1)} ms`)
  console.log(`    ${BURST} queries sequential  ${burstMs.toFixed(0)} ms`)
  console.log(`    ${BURST} queries parallel    ${parallelMs.toFixed(0)} ms`)
  return { connectMs, ...s, burstMs, parallelMs }
}

const env = loadEnv()

console.log(`\n  ${ROUNDS} round trips per target, then one ${BURST}-query burst.`)
console.log('  Measured from this machine — a fair proxy for Indonesian users,')
console.log('  and for a Vercel deployment only if it runs in the same region.')

const md = env.MOTHERDUCK_TOKEN
  ? await measure('MotherDuck  (pg.us-east-1-aws.motherduck.com)', {
      host: 'pg.us-east-1-aws.motherduck.com',
      port: 5432,
      user: 'postgres',
      password: env.MOTHERDUCK_TOKEN,
      database: 'md:',
      ssl: { rejectUnauthorized: true },
      connectionTimeoutMillis: 20000,
    })
  : null

const sb = env.SUPABASE_DB_URL
  ? await measure('Supabase', {
      connectionString: env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 20000,
    })
  : (console.log('\n  Supabase: SUPABASE_DB_URL not set in .env.local — skipped'), null)

if (md && sb) {
  const ratio = md.median / sb.median
  const saved = md.burstMs - sb.burstMs
  console.log(`\n  ${'='.repeat(64)}`)
  console.log(`  Supabase round trip is ${ratio.toFixed(1)}x ${ratio >= 1 ? 'faster' : 'slower'}`)
  console.log(`  A ${BURST}-query page load ${saved >= 0 ? 'saves' : 'costs'} ${Math.abs(saved).toFixed(0)} ms`)
  console.log(`  ${'='.repeat(64)}`)
  console.log('\n  Reading it: under ~2x, distance is not the reason to migrate and')
  console.log('  MotherDuck Lite is the cheaper answer. Several-fold means every')
  console.log('  page in the app gets faster in a way caching cannot deliver.')
}
