export const dynamic = 'force-dynamic'

// src/app/api/morning-brief/route.ts
import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET() {
  try {
    const [pulse, topRadar, groupRotation, alertFeed, stealth] = await Promise.all([
      run(`
        SELECT trading_date::VARCHAR AS date, stock_count::BIGINT, (total_value/1e12)::DOUBLE AS total_value_triliun,
               (total_foreign_flow/1e9)::DOUBLE AS foreign_net_miliar, whale_count::BIGINT, anomaly_count::BIGINT,
               gainers::BIGINT, losers::BIGINT, avg_change_pct::DOUBLE
        FROM market.vw_market_summary
        WHERE trading_date = (SELECT MAX(trading_date) FROM market.vw_market_summary) LIMIT 1
      `),
      run(`
        SELECT r.stock_code, r.sector, r.group_name, s.close::DOUBLE AS close,
               ROUND(r.change_percent::DOUBLE,2) AS change_percent, r.radar_score::INTEGER,
               r.composite_signal, ROUND(r.foreign_broker_net_7d::DOUBLE,2) AS fg_broker_7d,
               ROUND(r.local_inst_net_7d::DOUBLE,2) AS inst_7d,
               ROUND(r.ksei_net_smart_miliar::DOUBLE,2) AS ksei_smart,
               r.whale_signal::BOOLEAN, r.fresh_insider_buy::BOOLEAN,
               ROUND(r.aov_ratio_ma20::DOUBLE,2) AS aov_ratio, s.value::DOUBLE AS daily_value
        FROM market.vw_watchlist_radar r
        INNER JOIN market.vw_stock_latest s ON r.stock_code = s.stock_code
        WHERE r.warning_flag IS NULL AND s.close > 100 AND s.value > 5000000000
        ORDER BY r.radar_score DESC LIMIT 8
      `),
      run(`
        SELECT group_name, composite_score::INTEGER, market_phase, group_action_signal,
               total_stocks::BIGINT, ROUND(perf_1d::DOUBLE,2) AS perf_1d,
               ROUND(foreign_net_1d_miliar::DOUBLE,2) AS foreign_1d,
               smart_money_trend, broker_consensus
        FROM market.vw_group_phase_composite
        WHERE group_name != 'Others' ORDER BY composite_score DESC LIMIT 10
      `),
      run(`
        SELECT transaction_date::VARCHAR, stock_code, insider_name, insider_type, action_type,
               ROUND(ABS(pct_change)::DOUBLE,4) AS pct_change, alert_level,
               ROUND(COALESCE(est_value_miliar,0)::DOUBLE,3) AS est_value_miliar,
               days_ago::INTEGER, current_price::DOUBLE, sector, market_signal
        FROM main.vw_insider_alert_feed
        WHERE days_ago <= 7 AND action_type = 'BUY'
        ORDER BY days_ago ASC, ABS(pct_change) DESC LIMIT 8
      `),
      run(`
        SELECT Code AS stock_code, Price::DOUBLE AS price,
               ROUND(CP_Flow_Miliar::DOUBLE,2) AS cp_flow_miliar,
               ROUND(Price_Chg_Pct::DOUBLE,2) AS price_chg_pct, Signal
        FROM ksei.vw_stealth_accumulation
        WHERE signal != 'NORMAL'
        ORDER BY ABS(CP_Flow_Miliar) DESC LIMIT 6
      `),
    ])
    return NextResponse.json({ pulse: pulse[0] ?? null, topRadar, groupRotation, alertFeed, stealth })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
