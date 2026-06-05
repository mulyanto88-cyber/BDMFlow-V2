// /api/bandarmologi — broker intel: prime tracker, convergence map, leaderboard
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') ?? 'all'

    if (action === 'prime') {
      const data = await run(`SELECT stock_code, foreign_score, broker_score, whale_score, composite_score, composite_tier, sector, group_name, close, change_percent, return_5d, return_20d, rank_overall FROM market.vw_d_composite_tab ORDER BY broker_score DESC, composite_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'convergence') {
      const data = await run(`SELECT stock_code, foreign_score, broker_score, composite_score, composite_tier, sector, group_name, close, change_percent FROM market.vw_d_composite_tab ORDER BY foreign_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'leaderboard') {
      const data = await run(`SELECT stock_code, broker_score, foreign_score, whale_score, composite_score, composite_tier, sector, group_name, close, change_percent, return_5d FROM market.vw_d_composite_tab ORDER BY broker_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    const data = await run(`SELECT * FROM market.vw_d_composite_tab ORDER BY broker_score DESC LIMIT 25`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
