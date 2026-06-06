export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  try {
    const { query, params } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query diperlukan' }, { status: 400 })
    }

    // Read-only guard. Strip one trailing semicolon, then reject any remaining ';'
    // — this blocks the multi-statement bypass (e.g. "SELECT 1; ATTACH ...").
    const cleaned = query.trim().replace(/;\s*$/, '')
    if (cleaned.includes(';')) {
      return NextResponse.json({ error: 'Hanya satu statement diizinkan.' }, { status: 403 })
    }
    const upper = cleaned.toUpperCase()
    if (!upper.startsWith('SELECT') && !upper.startsWith('WITH')) {
      return NextResponse.json({ error: 'Operation not permitted. Only SELECT or WITH queries are allowed.' }, { status: 403 })
    }

    // Denylist DML/DDL + DuckDB-specific side-effecting commands (defense in depth)
    const forbiddenPatterns = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CREATE|ATTACH|DETACH|COPY|INSTALL|LOAD|PRAGMA|CALL)\b/i
    if (forbiddenPatterns.test(cleaned)) {
      return NextResponse.json({ error: 'Operation not permitted. Modifications are not allowed.' }, { status: 403 })
    }

    const data = await run(cleaned, params || [])
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[motherduck]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
