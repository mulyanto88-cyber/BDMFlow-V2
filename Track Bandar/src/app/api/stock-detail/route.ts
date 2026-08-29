import { NextRequest, NextResponse } from 'next/server'
import { runQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const symbol = (searchParams.get('symbol') || 'AWAN').toUpperCase().trim()

  try {
    // Query 1: Stock Overview & Latest Indicators
    const stockSql = `
      SELECT
        l.stock_code, l.group_name as company_name, l.sector, l.close, l.change_percent,
        l.value, l.volume, l.vwma_20d, l.aov_ratio_ma20, l.whale_signal, l.big_player_anomaly,
        r.radar_score, r.composite_signal, r.ksei_net_smart_miliar, r.foreign_broker_net_7d, r.local_inst_net_7d,
        s.aov_max_30d, s.spike_30d, s.foreign_30d, s.foreign_90d
      FROM market.tb_stock_latest l
      LEFT JOIN market.tb_radar r ON r.stock_code = l.stock_code
      LEFT JOIN market.tb_screener_allinone s ON s.stock_code = l.stock_code
      WHERE UPPER(TRIM(l.stock_code)) = $1
    `

    // Query 2: Broker Accumulation Summary for Ticker
    const brokerSql = `
      SELECT * FROM market.tb_broker_accumulation WHERE UPPER(TRIM(stock_code)) = $1
    `

    // Query 3: Top Broker Activity Recent Breakdown
    const activitySql = `
      SELECT date, broker_code, side, value, lot, avg_price
      FROM main.broker_activity
      WHERE UPPER(TRIM(stock_code)) = $1
      ORDER BY date DESC, value DESC
      LIMIT 20
    `

    const [stockRes, brokerRes, activityRes] = await Promise.all([
      runQuery(stockSql, [symbol], 600),
      runQuery(brokerSql, [symbol], 600),
      runQuery(activitySql, [symbol], 600),
    ])

    const stock = stockRes.rows[0] || null
    const brokerAccum = brokerRes.rows[0] || null
    const activities = activityRes.rows || []

    // Calculate Estimated Bandar Avg Cost & Floating Profit/Loss
    let estBandarAvgCost = stock?.vwma_20d || stock?.close || 0
    let bandarPnlPct = 0

    if (stock && stock.close > 0 && estBandarAvgCost > 0) {
      bandarPnlPct = ((stock.close - estBandarAvgCost) / estBandarAvgCost) * 100
    }

    return NextResponse.json({
      success: true,
      symbol,
      data: {
        stock,
        brokerAccum,
        activities,
        estBandarAvgCost,
        bandarPnlPct: Number(bandarPnlPct.toFixed(2)),
      },
      fromCache: stockRes.fromCache && brokerRes.fromCache && activityRes.fromCache,
    })
  } catch (err: any) {
    console.error('[API stock-detail error]:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
