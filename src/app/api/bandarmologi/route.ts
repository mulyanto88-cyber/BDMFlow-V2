// /api/bandarmologi — broker intel: prime tracker, convergence map, leaderboard
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') ?? 'all'

    // Check if vw_d_broker_intel_tab exists (from original 95 views)
    const hasBrokerIntel = await run(`SELECT COUNT(*)::INTEGER AS c FROM information_schema.tables WHERE table_name='vw_d_broker_intel_tab' AND table_schema='market'`)
      .then(r => (r[0]?.c ?? 0) > 0).catch(() => false)

    if (!hasBrokerIntel) {
      // Fallback: use vw_d_composite_tab for brokerage data
      if (action === 'prime') {
        const data = await run(`SELECT stock_code, foreign_score, broker_score, whale_score, composite_score, composite_tier, sector, group_name, close::DOUBLE, change_percent::DOUBLE, return_5d::DOUBLE, return_20d::DOUBLE, rank_overall FROM market.vw_d_composite_tab WHERE broker_score >= 12 OR foreign_score >= 18 ORDER BY broker_score DESC LIMIT 25`)
        return NextResponse.json(data)
      }
      if (action === 'convergence') {
        const data = await run(`SELECT stock_code, foreign_score, broker_score, composite_score, composite_tier, sector, close::DOUBLE, change_percent::DOUBLE FROM market.vw_d_composite_tab WHERE foreign_score >= 15 AND broker_score >= 10 ORDER BY composite_score DESC LIMIT 25`)
        return NextResponse.json(data)
      }
      const data = await run(`SELECT stock_code, foreign_score, broker_score, whale_score, composite_score, composite_tier, sector, group_name, close::DOUBLE, change_percent::DOUBLE, return_5d::DOUBLE FROM market.vw_d_composite_tab ORDER BY broker_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }

    // Primary: use vw_d_broker_intel_tab
    if (action === 'prime') {
      const data = await run(`SELECT stock_code, prime_buyers_5d, prime_net_5d::DOUBLE, prime_lead_signal, prime_conviction, composite_score, composite_tier, sector, close::DOUBLE, return_5d::DOUBLE FROM market.vw_d_broker_intel_tab WHERE prime_is_buyer_5d = true OR prime_lead_signal IN ('PRIME_LEADING','ALIGNED_BUY') ORDER BY prime_net_5d DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'convergence') {
      const data = await run(`SELECT stock_code, foreign_buyers_count, inst_buyers_count, convergence_level, foreign_net_5d::DOUBLE, composite_score, composite_tier, sector, close::DOUBLE FROM market.vw_d_broker_intel_tab WHERE convergence_level IN ('STRONG','MODERATE') ORDER BY foreign_buyers_count DESC, composite_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    if (action === 'leaderboard') {
      const data = await run(`SELECT stock_code, broker_score, composite_score, composite_tier, prime_net_5d::DOUBLE, convergence_level, sector, close::DOUBLE, change_percent::DOUBLE FROM market.vw_d_broker_intel_tab WHERE composite_score >= 40 ORDER BY broker_score DESC, composite_score DESC LIMIT 25`)
      return NextResponse.json(data)
    }
    const data = await run(`SELECT * FROM market.vw_d_broker_intel_tab WHERE composite_score >= 30 ORDER BY broker_score DESC LIMIT 25`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
