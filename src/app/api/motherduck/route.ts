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
    if (query.length > 8000) {
      return NextResponse.json({ error: 'Query terlalu panjang.' }, { status: 413 })
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

    // Denylist DML/DDL + DuckDB-specific side-effecting commands (defense in depth), AND the
    // file/URL-reading table functions (read_csv/read_parquet/glob/…) which are an SSRF / local-file
    // read / data-exfiltration vector. None of these appear in the app's legitimate read queries.
    const forbiddenPatterns = /\b(INSERT|UPDATE|DELETE|MERGE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CREATE|ATTACH|DETACH|COPY|INSTALL|LOAD|PRAGMA|CALL|INTO|read_csv|read_csv_auto|read_parquet|read_json|read_json_auto|read_ndjson|read_text|read_blob|parquet_scan|csv_scan|glob|sniff_csv|parquet_metadata|parquet_schema)\b/i
    if (forbiddenPatterns.test(cleaned)) {
      return NextResponse.json({ error: 'Operation not permitted. Modifications are not allowed.' }, { status: 403 })
    }

    const data = await run(cleaned, params || [])
    return NextResponse.json({ data })
  } catch (error: any) {
    // Log the real error server-side; return a generic message so DB internals (schema, table
    // names) aren't leaked to a public, unauthenticated caller.
    console.error('[motherduck]', error.message)
    return NextResponse.json({ error: 'Query gagal dijalankan.' }, { status: 500 })
  }
}
