export const revalidate = 3600

// src/app/api/morning-brief/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'

// Free-tier data (Morning Brief = dashboard) — rate-limited but never Pro-gated.
export async function GET(req: NextRequest) {
  const guarded = await guardApi(req, { pro: false })
  if (guarded) return guarded

  try {
    const [pulse, topRadar, groupRotation, alertFeed, stealth] = await Promise.all([
      run(`
        SELECT trading_date::VARCHAR AS date, stock_count::BIGINT AS stock_count, (total_value/1e12)::FLOAT8 AS total_value_triliun,
               (total_foreign_flow/1e9)::FLOAT8 AS foreign_net_miliar, whale_count::BIGINT AS whale_count, anomaly_count::BIGINT AS anomaly_count,
               gainers::BIGINT AS gainers, losers::BIGINT AS losers, avg_change_pct::FLOAT8 AS avg_change_pct
        FROM market.tb_market_summary
        ORDER BY trading_date DESC NULLS LAST LIMIT 1
      `),
      run(`
        SELECT r.stock_code, r.sector, r.group_name, s.close::FLOAT8 AS close,
               ROUND(r.change_percent::FLOAT8,2) AS change_percent, r.radar_score::INTEGER AS radar_score,
               r.composite_signal, ROUND((r.foreign_broker_net_7d::FLOAT8)::NUMERIC,2) AS fg_broker_7d,
               ROUND((r.local_inst_net_7d::FLOAT8)::NUMERIC,2) AS inst_7d,
               ROUND((r.ksei_net_smart_miliar::FLOAT8)::NUMERIC,2) AS ksei_smart,
               r.whale_signal::BOOLEAN AS whale_signal, r.fresh_insider_buy::BOOLEAN AS fresh_insider_buy,
               ROUND((r.aov_ratio_ma20::FLOAT8)::NUMERIC,2) AS aov_ratio, s.value::FLOAT8 AS daily_value
        FROM market.tb_radar r
        INNER JOIN market.tb_stock_latest s ON r.stock_code = s.stock_code
        WHERE r.warning_flag IS NULL AND s.close > 100 AND s.value > 5000000000
        ORDER BY r.radar_score DESC NULLS LAST LIMIT 8
      `),
      run(`
        SELECT group_name, composite_score::INTEGER AS composite_score, market_phase, group_action_signal,
               total_stocks::BIGINT AS total_stocks, ROUND((perf_1d::FLOAT8)::NUMERIC,2) AS perf_1d,
               ROUND((foreign_net_1d_miliar::FLOAT8)::NUMERIC,2) AS foreign_1d,
               smart_money_trend, broker_consensus
        FROM market.tb_group_phase_composite
        WHERE group_name != 'Others' ORDER BY composite_score DESC NULLS LAST LIMIT 10
      `),
      run(`
        SELECT transaction_date::VARCHAR AS transaction_date, stock_code, insider_name, insider_type, action_type,
               ROUND((ABS(pct_change)::FLOAT8)::NUMERIC,4) AS pct_change, alert_level,
               ROUND((COALESCE(est_value_miliar,0)::FLOAT8)::NUMERIC,3) AS est_value_miliar,
               days_ago::INTEGER AS days_ago, current_price::FLOAT8 AS current_price, sector, market_signal
        FROM main.tb_insider_alert_feed
        WHERE days_ago <= 7 AND action_type = 'BUY'
        ORDER BY days_ago ASC, ABS(pct_change) DESC NULLS LAST LIMIT 8
      `),
      // Latest KSEI month only. Without the date filter this ranked all-time
      // extremes, so the dashboard surfaced months-old rows (and the same stock
      // twice at different prices). Corporate-action months are excluded: when the
      // share count jumps, Δshares×price is a mechanical artifact, not a flow —
      // that is what produced the impossible "-52 T" reading.
      run(`
        WITH latest AS (SELECT MAX(Date) AS d FROM ksei.tb_stealth_accumulation),
        shares AS (
          SELECT Code, Date, Price, Total_Shares,
                 LAG(Total_Shares) OVER (PARTITION BY Code ORDER BY Date) AS prev_shares
          FROM ksei.monthly_snapshot
        )
        SELECT sa.Code AS stock_code, sa.Price::FLOAT8 AS price,
               ROUND((sa.CP_Flow_Miliar::FLOAT8)::NUMERIC,2) AS cp_flow_miliar,
               ROUND((sa.Price_Chg_Pct::FLOAT8)::NUMERIC,2) AS price_chg_pct, sa.Signal,
               sa.Date::VARCHAR AS as_of
        FROM ksei.tb_stealth_accumulation sa
        CROSS JOIN latest l
        LEFT JOIN shares sh ON sh.Code = sa.Code AND sh.Date = sa.Date
        WHERE sa.Date = l.d
          AND sa.Signal <> 'NORMAL'
          AND (sh.prev_shares IS NULL OR sh.prev_shares = 0
               OR ABS(sh.Total_Shares::FLOAT8 / sh.prev_shares - 1) <= 0.05)
          -- Arithmetic impossibility guard: a month's flow cannot exceed the
          -- stock's own market cap.
          AND (sh.Price IS NULL OR sh.Total_Shares IS NULL OR sh.Total_Shares = 0
               OR ABS(sa.CP_Flow_Miliar) * 1e9 <= sh.Price * sh.Total_Shares)
        ORDER BY ABS(sa.CP_Flow_Miliar) DESC NULLS LAST LIMIT 6
      `),
    ])
    return NextResponse.json({ pulse: pulse[0] ?? null, topRadar, groupRotation, alertFeed, stealth })
  } catch (err: any) {
    // Generic message — DB internals stay server-side.
    console.error('[morning-brief]', err?.message)
    return NextResponse.json({ error: 'Gagal mengambil data. Silakan coba lagi.' }, { status: 500 })
  }
}
