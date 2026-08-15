export const revalidate = 3600

// src/app/api/volume-aov/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'
import { intParam } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const guarded = await guardApi(req, { pro: true })
  if (guarded) return guarded

  const { searchParams } = new URL(req.url)
  const action  = searchParams.get('action') || 'screener'
  const sector  = searchParams.get('sector') || ''
  const minConf = intParam(searchParams.get('min_conf'), 3, 0, 8)
  const minVal  = intParam(searchParams.get('min_val'), 5000000000, 0, 10_000_000_000_000)

  try {
    if (action === 'screener') {
      // Bind parameter — never escaped-and-interpolated.
      const sectorFilter = sector ? `AND cp.sector = $1` : ''

      // Edge-weighted confluence (max 8), from our fwd-20d validation:
      //   AOV is the dominant signal & MONOTONIC by magnitude → graduated 3/2/1.
      //   whale strong (+2); big-player & VWMA-trend & vol-spike modest (+1 each).
      //   1-day foreign DROPPED from score (validated edge ≈ 0) — still shown as a column.
      const VOLR = `ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)`
      const CONF = `(
        (CASE WHEN d.aov_ratio_ma20 >= 3.0 THEN 3 WHEN d.aov_ratio_ma20 >= 2.0 THEN 2 WHEN d.aov_ratio_ma20 >= 1.5 THEN 1 ELSE 0 END)
        + (CASE WHEN d.whale_signal THEN 2 ELSE 0 END)
        + (CASE WHEN d.big_player_anomaly THEN 1 ELSE 0 END)
        + (CASE WHEN d.close::DOUBLE >= d.vwma_20d::DOUBLE THEN 1 ELSE 0 END)
        + (CASE WHEN ${VOLR} >= 2.0 THEN 1 ELSE 0 END)
      )`

      const data = await run(`
        WITH latest AS (SELECT MAX(trading_date) AS d FROM market.daily_transactions)
        SELECT
          d.stock_code,
          d.close::FLOAT8 AS close,
          d.change_percent::FLOAT8 AS change_percent,
          d.volume::BIGINT AS volume,
          d.ma20_volume::BIGINT AS ma20_volume,
          d.value::FLOAT8 AS value,
          ${VOLR}::FLOAT8 AS volume_ratio,
          d.aov_ratio_ma20::FLOAT8 AS aov_ratio_ma20,
          d.net_foreign_value::FLOAT8 AS net_foreign_value,
          d.whale_signal AS whale_signal,
          d.big_player_anomaly AS big_player_anomaly,
          d.vwma_20d::FLOAT8 AS vwma_20d,
          d.signal AS signal,
          cp.sector,
          cp.group_name,
          ${CONF}::INTEGER AS conf_score,
          CASE
            WHEN d.aov_ratio_ma20 >= 3.0 AND d.close::FLOAT8 >= d.vwma_20d::FLOAT8 THEN '🚀 AOV Ekstrem + Trend'
            WHEN d.aov_ratio_ma20 >= 3.0 THEN '🔥 AOV Ekstrem'
            WHEN d.aov_ratio_ma20 >= 2.0 AND (d.whale_signal OR d.close::FLOAT8 >= d.vwma_20d::FLOAT8) THEN '⚡ AOV Kuat + Konfirmasi'
            WHEN d.aov_ratio_ma20 >= 1.5 AND d.whale_signal THEN '⚡ AOV + Whale'
            WHEN d.aov_ratio_ma20 >= 1.5 THEN '⚡ AOV Spike'
            WHEN ${VOLR} >= 2.0 THEN '📊 Vol Spike'
            ELSE '⚪ Weak'
          END AS spike_type
        FROM market.daily_transactions d
        LEFT JOIN market.company_profile cp ON d.stock_code = cp.stock_code
        WHERE d.trading_date = (SELECT l.d FROM latest l)
          AND d.value > ${minVal} ${sectorFilter}
          AND ${CONF} >= ${minConf}
        ORDER BY conf_score DESC NULLS LAST, d.aov_ratio_ma20 DESC NULLS LAST, volume_ratio DESC NULLS LAST
        LIMIT 200
      `, sector ? [sector] : [])
      return NextResponse.json({ data })
    }

    if (action === 'sectors') {
      const data = await run(`
        SELECT DISTINCT cp.sector FROM market.company_profile cp
        WHERE cp.sector IS NOT NULL AND cp.sector != 'Others'
        ORDER BY cp.sector
      `)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    // Generic message — DB internals stay server-side.
    console.error('[volume-aov]', { action, message: err?.message })
    return NextResponse.json({ error: 'Gagal mengambil data. Silakan coba lagi.' }, { status: 500 })
  }
}
