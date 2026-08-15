// /api/composite — queries market.tb_broker_screener (materialized table)
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'
import { intParam } from '@/lib/utils'

export const revalidate = 300

export async function GET(request: NextRequest) {
  const guarded = await guardApi(request, { pro: true })
  if (guarded) return guarded

  try {
    const { searchParams } = new URL(request.url)
    const page = intParam(searchParams.get('page'), 1, 1, 100_000)
    const pageSize = intParam(searchParams.get('pageSize'), 25, 1, 50)
    const sector = searchParams.get('sector')
    const offset = (page - 1) * pageSize

    let where = ''
    const params: any[] = []
    if (sector) { where = `WHERE sector = $1`; params.push(sector) }

    const [data, countResult] = await Promise.all([
      run(`SELECT * FROM market.tb_broker_screener ${where} ORDER BY rank_overall ASC LIMIT ${pageSize} OFFSET ${offset}`, params),
      run(`SELECT COUNT(*)::INTEGER AS total FROM market.tb_broker_screener ${where}`, params),
    ])

    const total = countResult[0]?.total ?? data.length
    return NextResponse.json({ data, total, page, pageSize })
  } catch (err: any) {
    // Generic message — DB internals stay server-side.
    console.error('[composite]', err?.message)
    return NextResponse.json({ error: 'Gagal mengambil data. Silakan coba lagi.', data: [], total: 0, page: 1, pageSize: 25 }, { status: 500 })
  }
}
