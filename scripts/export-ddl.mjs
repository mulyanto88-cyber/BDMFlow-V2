// ============================================================
// scripts/export-ddl.mjs
// Export every view/table definition from MotherDuck into sql/ so the analytical
// logic — the actual product IP — lives in the repo instead of only inside the
// vendor. Read-only: it queries duckdb_views()/duckdb_tables() metadata.
//
//   PG_DIR=<dir with node_modules/pg> node scripts/export-ddl.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { join } from 'node:path'

function loadPg() {
  const req = createRequire(import.meta.url)
  try { return req('pg') } catch {}
  if (process.env.PG_DIR) {
    try { return createRequire(pathToFileURL(join(process.env.PG_DIR, 'noop.js')))('pg') } catch {}
  }
  console.error('ERROR: cannot load "pg". Set PG_DIR to a folder containing node_modules/pg.')
  process.exit(1)
}
const { Pool } = loadPg()

const raw = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
if (!process.env.MOTHERDUCK_TOKEN) {
  console.error('ERROR: MOTHERDUCK_TOKEN missing in .env.local')
  process.exit(1)
}

const pool = new Pool({
  host: 'pg.us-east-1-aws.motherduck.com', port: 5432, user: 'postgres',
  password: process.env.MOTHERDUCK_TOKEN, database: 'md:',
  ssl: { rejectUnauthorized: true }, max: 2, connectionTimeoutMillis: 30000,
})

const OUT = new URL('../sql/', import.meta.url).pathname.replace(/^\//, '')
mkdirSync(OUT, { recursive: true })

const client = await pool.connect()
try {
  const views = (await client.query(`
    SELECT schema_name, view_name AS name, sql
    FROM duckdb_views()
    WHERE database_name = 'my_db' AND NOT internal
    ORDER BY schema_name, view_name
  `)).rows

  const tables = (await client.query(`
    SELECT schema_name, table_name AS name, estimated_size, column_count
    FROM duckdb_tables()
    WHERE database_name = 'my_db' AND NOT internal
    ORDER BY schema_name, table_name
  `)).rows

  // One file per schema keeps diffs readable when a single view changes.
  const bySchema = {}
  for (const v of views) (bySchema[v.schema_name] ||= []).push(v)

  for (const [schema, list] of Object.entries(bySchema)) {
    const body = list.map(v =>
      `-- ─────────────────────────────────────────────────────────────\n` +
      `-- ${schema}.${v.name}\n` +
      `-- ─────────────────────────────────────────────────────────────\n` +
      `${(v.sql || '').trim()}\n`
    ).join('\n')
    const file = join(OUT, `views_${schema}.sql`)
    writeFileSync(file, `-- Auto-exported from MotherDuck by scripts/export-ddl.mjs\n-- Schema: ${schema} · ${list.length} views\n\n${body}`)
    console.log(`${String(list.length).padStart(3)} views  ->  sql/views_${schema}.sql`)
  }

  const inv = tables.map(t =>
    `${t.schema_name}.${t.name}\t${t.estimated_size ?? '?'} rows\t${t.column_count} cols`
  ).join('\n')
  writeFileSync(join(OUT, 'tables_inventory.tsv'),
    `schema.table\testimated_rows\tcolumns\n${inv}\n`)
  console.log(`${String(tables.length).padStart(3)} tables ->  sql/tables_inventory.tsv`)
} finally {
  client.release()
  await pool.end()
}
