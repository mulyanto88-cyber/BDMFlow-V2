export const dynamic = 'force-dynamic'

// src/app/api/volume-aov/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action  = searchParams.get('action') || 'screener'
  const period  = searchParams.get('period') || '7d'
  const sector  = searchParams.get('sector') || ''
  const minConf = parseInt(searchParams.get('min_conf') || '2')
  const minVal  = parseInt(searchParams.get('min_val') || '5000000000')

  try {
    if (action === 'screener') {
      const periodMap: Record<string,string> = { '1d':'1','7d':'7','14d':'14','30d':'30','90d':'90' }
      const days = periodMap[period] || '7'
      const sectorFilter = sector ? `AND cp.sector = '${sector.replace(/'/g,"''")}'` : ''

      const data = await run(`
        WITH latest AS (SELECT MAX(trading_date) AS d FROM market.daily_transactions),
        period_data AS (
          SELECT stock_code,
                 COUNT(CASE WHEN aov_ratio_ma20 >= 1.5 THEN 1 END)::INTEGER AS aov_spikes,
                 COUNT(CASE WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 2.0 THEN 1 END)::INTEGER AS vol_spikes,
                 ROUND(SUM(net_foreign_value)/1e9,3)::DOUBLE AS foreign_net_miliar,
                 COUNT(CASE WHEN whale_signal THEN 1 END)::INTEGER AS whale_days
          FROM market.daily_transactions
          WHERE CAST(trading_date AS DATE) >= (SELECT d FROM latest) - INTERVAL '${days} days'
          GROUP BY stock_code
        )
        SELECT
          d.stock_code,
          d.close::DOUBLE AS close,
          d.change_percent::DOUBLE AS change_percent,
          d.volume::BIGINT AS volume,
          d.ma20_volume::BIGINT AS ma20_volume,
          d.value::DOUBLE AS value,
          ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE AS volume_ratio,
          d.aov_ratio_ma20::DOUBLE AS aov_ratio_ma20,
          d.net_foreign_value::DOUBLE AS net_foreign_value,
          d.whale_signal AS whale_signal,
          d.big_player_anomaly AS big_player_anomaly,
          d.vwma_20d::DOUBLE AS vwma_20d,
          d.signal AS signal,
          cp.sector,
          cp.group_name,
          COALESCE(p.aov_spikes,0)      AS aov_spikes_period,
          COALESCE(p.vol_spikes,0)      AS vol_spikes_period,
          COALESCE(p.foreign_net_miliar,0) AS foreign_net_miliar,
          COALESCE(p.whale_days,0)      AS whale_days_period,
          (CASE WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 THEN 1 ELSE 0 END
          + CASE WHEN d.aov_ratio_ma20 >= 1.5 THEN 1 ELSE 0 END
          + CASE WHEN d.net_foreign_value > 0 THEN 1 ELSE 0 END
          + CASE WHEN d.whale_signal THEN 1 ELSE 0 END
          + CASE WHEN d.close::DOUBLE >= d.vwma_20d::DOUBLE THEN 1 ELSE 0 END)::INTEGER AS conf_score,
          CASE
            WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 AND d.aov_ratio_ma20 >= 1.5 AND d.net_foreign_value > 0 THEN '🚀 Triple Confirm'
            WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 AND d.aov_ratio_ma20 >= 1.5 THEN '⚡ Vol + AOV'
            WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 AND d.net_foreign_value > 0 THEN '🌏 Vol + Foreign'
            WHEN d.aov_ratio_ma20 >= 1.5 AND d.net_foreign_value > 0 THEN '🏛️ AOV + Foreign'
            WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 THEN '📊 Vol Spike'
            WHEN d.aov_ratio_ma20 >= 1.5 THEN '⚡ AOV Spike'
            ELSE '⚪ Weak'
          END AS spike_type
        FROM market.daily_transactions d
        LEFT JOIN market.company_profile cp ON d.stock_code = cp.stock_code
        LEFT JOIN period_data p ON d.stock_code = p.stock_code
        WHERE d.trading_date = (SELECT l.d FROM latest l)
          AND d.value > ${minVal} ${sectorFilter}
          AND (CASE WHEN ROUND((d.volume::DOUBLE / NULLIF(d.ma20_volume,0)),2)::DOUBLE >= 2.0 THEN 1 ELSE 0 END
             + CASE WHEN d.aov_ratio_ma20 >= 1.5 THEN 1 ELSE 0 END
             + CASE WHEN d.net_foreign_value > 0 THEN 1 ELSE 0 END
             + CASE WHEN d.whale_signal THEN 1 ELSE 0 END
             + CASE WHEN d.close::DOUBLE >= d.vwma_20d::DOUBLE THEN 1 ELSE 0 END) >= ${minConf}
        ORDER BY conf_score DESC, volume_ratio DESC
        LIMIT 200
      `)
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
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
