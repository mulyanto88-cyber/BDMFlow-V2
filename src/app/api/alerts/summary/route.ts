// /api/alerts/summary — queries market.vw_a_alert_summary (Phase A view — master alert center)
import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await run(`SELECT * FROM market.vw_a_alert_summary ORDER BY highest_severity DESC, alert_rank_score DESC`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
