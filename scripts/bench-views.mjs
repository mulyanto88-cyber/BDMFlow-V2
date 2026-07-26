// ============================================================
// scripts/bench-views.mjs
// Time every live view the app queries, to decide which are worth materialising.
// COUNT(*) forces full evaluation, so the number reflects what a user pays on
// each page load today. One warm connection, so cold-connect isn't counted 32x.
//
//   PG_DIR=<dir with node_modules/pg> node scripts/bench-views.mjs
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

function loadPg() {
  const req = createRequire(import.meta.url)
  try { return req('pg') } catch {}
  if (process.env.PG_DIR) {
    try { return createRequire(pathToFileURL(join(process.env.PG_DIR, 'noop.js')))('pg') } catch {}
  }
  console.error('ERROR: cannot load "pg". Set PG_DIR.')
  process.exit(1)
}
const { Pool } = loadPg()

const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

// The live views the app actually reads (from a grep of src/lib + src/app/api).
const VIEWS = [
  'ksei.vw_insider_screener', 'ksei.vw_ksei_individual_changes', 'ksei.vw_ksei_inst_positioning',
  'ksei.vw_ownership_1pct_latest', 'ksei.vw_stealth_accumulation', 'ksei.vw_top_investors',
  'ksei.vw_whale_timing',
  'main.vw_broker_daily', 'main.vw_broker_market_breadth', 'main.vw_insider_activity_feed',
  'main.vw_insider_alert_feed', 'main.vw_insider_conviction_score', 'main.vw_insider_latest_position',
  'main.vw_insider_net_flow_by_stock', 'main.vw_insider_with_market',
  'market.vw_a_alert_summary', 'market.vw_broker_ksei_confirm', 'market.vw_c_composite_score',
  'market.vw_group_broker_stance', 'market.vw_group_leader_laggard', 'market.vw_group_multi_period_perf',
  'market.vw_group_phase_composite', 'market.vw_screener_allinone', 'market.vw_sector_analytics',
  'market.vw_smart_money_score', 'market.vw_stock_detail', 'market.vw_stock_latest',
  'market.vw_stock_multi_signal', 'market.vw_tactical_momentum_smart_money', 'market.vw_watchlist_radar',
  'market.vw_ownership_1pct_latest', 'market.vw_f_price_history',
]

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com', port: 5432, user: 'postgres',
  password: process.env.MOTHERDUCK_TOKEN, database: 'md:',
  ssl: { rejectUnauthorized: true }, max: 2, connectionTimeoutMillis: 30000,
})

const TIMEOUT_MS = 45000
const client = await pool.connect()
const results = []

console.log('view'.padEnd(46) + 'rows'.padStart(10) + 'ms'.padStart(9))
console.log('─'.repeat(65))

for (const v of VIEWS) {
  const t0 = Date.now()
  try {
    // Per-statement cap so one pathological view can't stall the whole run.
    await client.query(`SET statement_timeout = ${TIMEOUT_MS}`)
    const r = await client.query(`SELECT COUNT(*) AS n FROM ${v}`)
    const ms = Date.now() - t0
    const n = Number(r.rows[0].n)
    results.push({ view: v, ms, rows: n, ok: true })
    console.log(v.padEnd(46) + String(n).padStart(10) + String(ms).padStart(9))
  } catch (e) {
    const ms = Date.now() - t0
    const msg = /timeout/i.test(e.message) ? `>${TIMEOUT_MS / 1000}s` : e.message.slice(0, 30)
    results.push({ view: v, ms, rows: null, ok: false, error: msg })
    console.log(v.padEnd(46) + msg.padStart(10) + String(ms).padStart(9))
  }
}

client.release()
await pool.end()

results.sort((a, b) => b.ms - a.ms)
writeFileSync(new URL('../sql/view-bench.tsv', import.meta.url).pathname.replace(/^\//, ''),
  'view\tms\trows\tstatus\n' +
  results.map(r => `${r.view}\t${r.ms}\t${r.rows ?? ''}\t${r.ok ? 'ok' : r.error}`).join('\n') + '\n')

const slow = results.filter(r => r.ms >= 2000)
console.log(`\n${slow.length} view ≥2s (kandidat utama materialisasi):`)
slow.forEach(r => console.log(`  ${String(r.ms).padStart(6)} ms  ${r.view}`))
console.log('\n-> sql/view-bench.tsv')
