// /api/composite — queries market.tb_broker_screener (materialized table)
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '25')))
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
    return NextResponse.json({ error: err.message, data: [], total: 0, page: 1, pageSize: 25 }, { status: 500 })
  }
}
