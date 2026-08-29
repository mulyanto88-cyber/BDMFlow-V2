// Merge DB names → src/lib/company-names.ts (dijalankan dari scripts/gen-company-names-db.mjs)
import { readFileSync, writeFileSync } from 'node:fs'
const db = JSON.parse(readFileSync('_dbnames.json', 'utf8'))
console.log('db rows:', db.length)
const map = {}
for (const r of db) {
  const c = String(r.stock_code || '').trim()
  const n = String(r.company_name || '').trim()
  if (c && n) map[c] = n
}
console.log('names:', Object.keys(map).length)
const lines = []
lines.push('// Generated dari market.company_profile (MotherDuck) — jangan edit manual.')
lines.push('// Jalankan ulang: node scripts/gen-company-names-db.mjs (setelah export _dbnames.json)')
lines.push('export const COMPANY_NAMES: Record<string, string> = {')
for (const code of Object.keys(map).sort()) {
  const v = String(map[code]).replace(/\"/g, "'")
  lines.push('  "' + code + '": "' + v + '",')
}
lines.push('}')
writeFileSync('src/lib/company-names.ts', lines.join('\n'), 'utf8')
console.log('written src/lib/company-names.ts with', Object.keys(map).length, 'names')