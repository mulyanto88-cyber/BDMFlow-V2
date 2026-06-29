// /api/bandarmologi — broker intel: prime tracker, convergence map, leaderboard
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const revalidate = 300

// Percentile tier from tb_score_calibration — the absolute composite_tier never reaches
// STRONG_BUY/BUY (composite_score maxes ~56). LEFT JOIN ON TRUE → safe fallback to NEUTRAL
// if the calibration table is missing/empty (no rows dropped).
const TIER_CTE = `cal AS (SELECT p50, p85, p95, p99 FROM market.tb_score_calibration WHERE metric = 'composite_score' LIMIT 1)`
const TIER_CASE = `CASE
    WHEN t.composite_score >= cal.p99 THEN 'STRONG_BUY'
    WHEN t.composite_score >= cal.p95 THEN 'BUY'
    WHEN t.composite_score >= cal.p85 THEN 'ACCUMULATE'
    WHEN t.composite_score >= cal.p50 THEN 'WATCH'
    ELSE 'NEUTRAL' END AS tier_pct`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') ?? 'all'

    if (action === 'prime') {
      const data = await run(`WITH ${TIER_CTE}
        SELECT t.stock_code, t.foreign_score, t.broker_score, t.whale_score, t.composite_score,
               t.composite_tier, ${TIER_CASE}, t.sector, t.group_name, t.close, t.change_percent,
               t.return_5d, t.return_20d, t.rank_overall
        FROM market.tb_broker_screener t LEFT JOIN cal ON TRUE
        ORDER BY t.broker_score DESC, t.composite_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'convergence') {
      const data = await run(`WITH ${TIER_CTE}
        SELECT t.stock_code, t.foreign_score, t.broker_score, t.composite_score, t.composite_tier,
               ${TIER_CASE}, t.sector, t.group_name, t.close, t.change_percent
        FROM market.tb_broker_screener t LEFT JOIN cal ON TRUE
        ORDER BY t.foreign_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'leaderboard') {
      const data = await run(`WITH ${TIER_CTE}
        SELECT t.stock_code, t.broker_score, t.foreign_score, t.whale_score, t.composite_score,
               t.composite_tier, ${TIER_CASE}, t.sector, t.group_name, t.close, t.change_percent, t.return_5d
        FROM market.tb_broker_screener t LEFT JOIN cal ON TRUE
        ORDER BY t.broker_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    const data = await run(`WITH ${TIER_CTE}
      SELECT t.*, ${TIER_CASE} FROM market.tb_broker_screener t LEFT JOIN cal ON TRUE
      ORDER BY t.broker_score DESC LIMIT 25`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
