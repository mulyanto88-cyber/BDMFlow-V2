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

    // Basic SQL Injection prevention for read-only endpoint
    const trimmedQuery = query.trim().toUpperCase()
    if (!trimmedQuery.startsWith('SELECT') && !trimmedQuery.startsWith('WITH')) {
      return NextResponse.json({ error: 'Operation not permitted. Only SELECT or WITH queries are allowed.' }, { status: 403 })
    }

    const forbiddenPatterns = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|CREATE)\b/i
    if (forbiddenPatterns.test(query)) {
      return NextResponse.json({ error: 'Operation not permitted. Modifications are not allowed.' }, { status: 403 })
    }

    const data = await run(query, params || [])
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('[motherduck]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
