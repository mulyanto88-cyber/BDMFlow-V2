// ============================================================
// scripts/db-query.mjs
// Read-only MotherDuck query runner — for audit & verification.
//
// SAFETY:
//   • Reads MOTHERDUCK_TOKEN from .env.local and NEVER prints it.
//   • Hard read-only guard: only SELECT/WITH/EXPLAIN/SUMMARIZE/SHOW/DESCRIBE,
//     single statement, DML/DDL keywords rejected. This tool cannot mutate the DB.
//
// Usage:
//   node scripts/db-query.mjs <query.sql>            # run SQL from a file
//   node scripts/db-query.mjs --sql "SELECT 1"       # run inline SQL
//   node scripts/db-query.mjs <query.sql> --json     # raw JSON output
//   node scripts/db-query.mjs <query.sql> --explain  # prepend EXPLAIN ANALYZE (perf)
// ============================================================
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

// Load "pg". Prefer the project's node_modules; fall back to PG_DIR (a folder
// that contains node_modules/pg) so this works even before a full install.
function loadPg() {
  const req = createRequire(import.meta.url)
  try { return req('pg') } catch {}
  const dir = process.env.PG_DIR
  if (dir) {
    try {
      const base = pathToFileURL(join(dir, 'noop.js')) // base file need not exist
      return createRequire(base)('pg')
    } catch {}
  }
  console.error('ERROR: cannot load "pg". Run "npm install pg", or set PG_DIR to a folder containing node_modules/pg.')
  process.exit(1)
}
const { Pool } = loadPg()

// ---- load .env.local without echoing secrets ----
function loadEnvLocal() {
  let raw
  try {
    raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
  } catch {
    console.error('ERROR: .env.local not found at project root.\n' +
      'Create it and add a line:  MOTHERDUCK_TOKEN=your_token_here')
    process.exit(1)
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    let val = m[2]
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val
  }
}
loadEnvLocal()

const token = process.env.MOTHERDUCK_TOKEN
if (!token) {
  console.error('ERROR: MOTHERDUCK_TOKEN is missing in .env.local')
  process.exit(1)
}

// ---- parse args ----
const args = process.argv.slice(2)
const jsonOut = args.includes('--json')
const explain = args.includes('--explain')
const sqlIdx = args.indexOf('--sql')
let sql
if (sqlIdx !== -1) {
  sql = args[sqlIdx + 1] || ''
} else {
  const file = args.find((a) => !a.startsWith('--'))
  if (!file) {
    console.error('Usage: node scripts/db-query.mjs <query.sql> [--json] [--explain]')
    process.exit(1)
  }
  sql = readFileSync(file, 'utf8')
}

// ---- read-only guard (defense in depth; keeps this tool incapable of writes) ----
let cleaned = sql.trim().replace(/;\s*$/, '')

// All guards run against the comment-free text. Prose in a comment is never
// executed, so a ";" or the word "drop" inside one must not trip the checks.
const codeOnly = cleaned
  .replace(/--[^\n]*/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')

if (codeOnly.includes(';')) {
  console.error('ERROR: only a single statement is allowed (found an inner ";").')
  process.exit(1)
}
const head = codeOnly.replace(/^[\s(]+/, '').toUpperCase()
if (!/^(SELECT|WITH|EXPLAIN|SUMMARIZE|SHOW|DESCRIBE|PIVOT|FROM|TABLE|VALUES)\b/.test(head)) {
  console.error('ERROR: read-only tool — must start with SELECT/WITH/EXPLAIN/SUMMARIZE/SHOW/DESCRIBE.')
  process.exit(1)
}
if (/\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CREATE|ATTACH|DETACH|COPY|INSTALL|LOAD|CALL|INTO)\b/i.test(codeOnly)) {
  console.error('ERROR: read-only tool — a forbidden (write/side-effecting) keyword was detected.')
  process.exit(1)
}
if (explain) cleaned = 'EXPLAIN ANALYZE ' + cleaned

// ---- connect (same target as src/lib/db.ts) ----
const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: token,
  database: 'md:',
  ssl: { rejectUnauthorized: true },
  max: 4,
  connectionTimeoutMillis: 30000,
})

const t0 = Date.now()
try {
  const res = await pool.query(cleaned)
  const ms = Date.now() - t0
  const rows = res.rows || []

  if (explain) {
    for (const r of rows) console.log(Object.values(r).join('\n'))
  } else if (jsonOut) {
    console.log(JSON.stringify(rows, null, 2))
  } else if (rows.length === 0) {
    console.log('(0 rows)')
  } else {
    const MAX = 100
    console.table(rows.slice(0, MAX))
    if (rows.length > MAX) console.log(`... (${rows.length - MAX} more rows; use --json or add LIMIT)`)
  }
  console.error(`\n[ok] ${rows.length} row(s) in ${ms} ms`)
} catch (err) {
  console.error(`[query error] ${err.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}
