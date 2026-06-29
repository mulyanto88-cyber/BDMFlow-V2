// /api/alerts/summary — queries market.vw_a_alert_summary (Phase A view — master alert center)
import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

// NOT force-dynamic: that sent no-store and defeated the /api/alerts/* edge cache in next.config.js,
// so the heavy view recomputed on EVERY request. Data is T+1 → revalidate every 30 min.
export const revalidate = 1800

export async function GET() {
  try {
    const data = await run(`SELECT * FROM market.vw_a_alert_summary ORDER BY highest_severity DESC, alert_rank_score DESC`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
