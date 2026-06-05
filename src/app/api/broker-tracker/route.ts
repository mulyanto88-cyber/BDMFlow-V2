  // src/app/api/broker-tracker/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const dynamic = 'force-dynamic'

// ─── Helper Functions ───────────────────────────────────────────────────────

function buildDateFilter(days: string | null, startDate: string | null, endDate: string | null) {
  if (startDate && endDate) {
    const re = /^\d{4}-\d{2}-\d{2}$/
    if (!re.test(startDate) || !re.test(endDate)) throw new Error('Format tanggal tidak valid. Gunakan YYYY-MM-DD')
    return { clause: `CAST(date AS DATE) BETWEEN $1::DATE AND $2::DATE`, params: [startDate, endDate] }
  }
  const d = parseInt(days || '5')
  if (isNaN(d) || d < 0) throw new Error('Parameter days harus angka positif')
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - d)
  return { clause: `CAST(date AS DATE) >= $1::DATE`, params: [cutoff.toISOString().split('T')[0]] }
}

function validateStockCode(code: string): string {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (cleaned.length < 1 || cleaned.length > 10) throw new Error('Kode saham tidak valid')
  return cleaned
}

function safeRun(query: string, params: any[]): Promise<any[]> {
  return run(query, params).catch((err: any) => {
    console.error('[broker-tracker] Query failed:', { query: query.substring(0, 200), error: err.message })
    throw new Error(`Query execution failed: ${err.message}`)
  })
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action         = searchParams.get('action')
  const code           = searchParams.get('code') || ''
  const days           = searchParams.get('days')
  const startDate      = searchParams.get('startDate')
  const endDate        = searchParams.get('endDate')
  const brokerCode     = searchParams.get('broker_code') || ''
  const brokerCodes    = searchParams.get('broker_codes') || ''
  const minTotalValue   = searchParams.get('min_total_value')       || '1000000000'
  const minBrokerCount  = searchParams.get('min_broker_count')      || '3'
  const minBuyBroker    = searchParams.get('min_buy_broker_count')   || '2'
  const minPowerScore   = searchParams.get('min_power_score')        || '0'
  const minNetMiliar    = parseFloat(searchParams.get('min_net_miliar')    || '0.5')  // min 500 juta net
  const maxSellPressure = parseFloat(searchParams.get('max_sell_pressure') || '85')   // max 85% sell vs buy
  const sector          = searchParams.get('sector')                 || ''
  const whaleOnly       = searchParams.get('whale_only')             === 'true'

  let dateFilter
  try { dateFilter = buildDateFilter(days, startDate, endDate) }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }) }

  let query      = ''
  let queryParams: any[] = [...dateFilter.params]
  let paramIdx   = dateFilter.params.length

  try {
    // ── 1. TRACKER ─────────────────────────────────────────────────────────
    if (action === 'tracker') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        SELECT
          ba.broker_code,
          MAX(ba.broker_name)                                                AS broker_name,
          -- ★ Local/Foreign badge dari broker_classification
          CASE WHEN LOWER(COALESCE(bc.category,'')) = 'foreign' THEN 'F' ELSE 'L' END AS broker_lf,
          COALESCE(bc.is_prime, false)                                       AS is_prime,
          SUM(CASE WHEN ba.value>0 THEN ba.value ELSE 0 END)::DOUBLE        AS buy_val,
          SUM(CASE WHEN ba.value>0 THEN ba.lot   ELSE 0 END)::DOUBLE        AS buy_lot,
          SUM(CASE WHEN ba.value>0 THEN ba.freq  ELSE 0 END)::BIGINT        AS buy_freq,
          ABS(SUM(CASE WHEN ba.value<0 THEN ba.value ELSE 0 END))::DOUBLE   AS sell_val,
          ABS(SUM(CASE WHEN ba.value<0 THEN ba.lot   ELSE 0 END))::DOUBLE   AS sell_lot,
          SUM(CASE WHEN ba.value<0 THEN ba.freq  ELSE 0 END)::BIGINT        AS sell_freq,
          SUM(ba.value)::DOUBLE                                              AS net_val,
          SUM(ba.lot)::DOUBLE                                                AS net_lot,
          (SUM(CASE WHEN ba.value>0 THEN ba.freq ELSE 0 END)
           + SUM(CASE WHEN ba.value<0 THEN ba.freq ELSE 0 END))::BIGINT     AS total_freq,
          (SUM(CASE WHEN ba.value>0 THEN ba.value ELSE 0 END)
           / NULLIF(SUM(CASE WHEN ba.value>0 THEN ba.lot ELSE 0 END)*100.0,0))
          ::DOUBLE                                                           AS buy_avg_price,
          (ABS(SUM(CASE WHEN ba.value<0 THEN ba.value ELSE 0 END))
           / NULLIF(ABS(SUM(CASE WHEN ba.value<0 THEN ba.lot ELSE 0 END))*100.0,0))
          ::DOUBLE                                                           AS sell_avg_price
        FROM broker_activity ba
        LEFT JOIN broker_classification bc ON bc.broker_code = ba.broker_code
        WHERE ${dateFilter.clause}
          AND LEFT(ba.stock_code,4) = $${paramIdx}
        GROUP BY ba.broker_code, bc.category, bc.is_prime
        ORDER BY net_val DESC`

    // ── 2. HISTORY ─────────────────────────────────────────────────────────
    } else if (action === 'history') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        SELECT
          CAST(date AS VARCHAR)                                              AS date,
          SUM(value)::DOUBLE                                                 AS daily_net_val,
          SUM(CASE WHEN value>0 THEN value ELSE 0 END)::DOUBLE               AS daily_buy_val,
          ABS(SUM(CASE WHEN value<0 THEN value ELSE 0 END))::DOUBLE          AS daily_sell_val,
          SUM(lot)::DOUBLE                                                    AS daily_net_lot,
          SUM(CASE WHEN value>0 THEN freq ELSE 0 END)::BIGINT                AS daily_buy_freq,
          SUM(CASE WHEN value<0 THEN freq ELSE 0 END)::BIGINT                AS daily_sell_freq,
          (SUM(CASE WHEN value>0 THEN value ELSE 0 END)
           / NULLIF(SUM(CASE WHEN value>0 THEN lot ELSE 0 END)*100.0,0))
          ::DOUBLE                                                            AS daily_avg_price
        FROM broker_activity
        WHERE ${dateFilter.clause}
          AND LEFT(stock_code,4) = $${paramIdx}
        GROUP BY date
        ORDER BY date ASC`

    // ── 3. PRICE HISTORY ───────────────────────────────────────────────────
    } else if (action === 'price_history') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        SELECT
          CAST(trading_date AS VARCHAR) AS date,
          close,
          change_percent,
          volume,
          net_foreign_value,
          whale_signal,
          big_player_anomaly
        FROM market.vw_stock_detail
        WHERE CAST(trading_date AS DATE) BETWEEN $1::DATE AND $2::DATE
          AND stock_code = $${paramIdx}
        ORDER BY trading_date ASC`

    // ── 4. STOCK CONTEXT ───────────────────────────────────────────────────
    } else if (action === 'stock_context') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        SELECT
          s.stock_code, s.sector, s.close, s.change_percent,
          s.foreign_30d, s.broker_net, s.whale_signal, s.big_player_anomaly,
          s.aov_ratio_ma20, s.smart_money_score, s.signal,
          k.broker_net_miliar,
          k.local_smart_miliar_saham,
          k.foreign_smart_miliar_saham,
          k.confirmation AS ksei_confirmation
        FROM market.vw_smart_money_score s
        LEFT JOIN market.vw_broker_ksei_confirm k ON k.stock_code = s.stock_code
        WHERE s.stock_code = $${paramIdx}
        LIMIT 1`

    // ── 5. BROKER CONVICTION ───────────────────────────────────────────────
    } else if (action === 'broker_conviction') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        WITH daily AS (
          SELECT broker_code, CAST(date AS DATE) AS d, SUM(value) AS net_val
          FROM broker_activity
          WHERE ${dateFilter.clause} AND LEFT(stock_code,4) = $${paramIdx}
          GROUP BY broker_code, CAST(date AS DATE)
        )
        SELECT
          broker_code,
          COUNT(*)                                          AS total_days,
          SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END)     AS net_buy_days,
          SUM(CASE WHEN net_val < 0 THEN 1 ELSE 0 END)     AS net_sell_days,
          ROUND(SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),1)::DOUBLE AS buy_consistency_pct
        FROM daily
        GROUP BY broker_code`

    // ── 6. BROKER PROFILE ──────────────────────────────────────────────────
    } else if (action === 'broker_profile') {
      const cleanBroker = brokerCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!cleanBroker) return NextResponse.json({ error: 'broker_code diperlukan' }, { status: 400 })
      paramIdx++
      queryParams.push(cleanBroker)
      const summaryQuery = `
        SELECT
          broker_code, MAX(broker_name) AS broker_name,
          COUNT(DISTINCT CAST(date AS DATE))    AS active_days,
          COUNT(DISTINCT LEFT(stock_code,4))    AS total_stocks,
          SUM(CASE WHEN value>0 THEN value ELSE 0 END)::DOUBLE   AS total_buy_value,
          ABS(SUM(CASE WHEN value<0 THEN value ELSE 0 END))::DOUBLE AS total_sell_value,
          SUM(value)::DOUBLE AS net_value,
          ROUND(SUM(CASE WHEN value>0 THEN value ELSE 0 END)*100.0/NULLIF(SUM(ABS(value)),0),1)::DOUBLE AS buy_ratio_pct
        FROM broker_activity WHERE broker_code = $${paramIdx} GROUP BY broker_code`
      const favQuery = `
        SELECT
          LEFT(stock_code,4) AS stock_code,
          SUM(CASE WHEN value>0 THEN value ELSE 0 END)::DOUBLE   AS buy_value,
          ABS(SUM(CASE WHEN value<0 THEN value ELSE 0 END))::DOUBLE AS sell_value,
          SUM(value)::DOUBLE AS net_value,
          COUNT(*)::BIGINT   AS total_transactions,
          (SUM(CASE WHEN value>0 THEN value ELSE 0 END)/NULLIF(SUM(CASE WHEN value>0 THEN lot ELSE 0 END)*100.0,0))::DOUBLE AS avg_buy_price
        FROM broker_activity WHERE broker_code = $${paramIdx}
        GROUP BY LEFT(stock_code,4)
        ORDER BY ABS(SUM(value)) DESC LIMIT 10`
      const [summaryData, favData] = await Promise.all([safeRun(summaryQuery, queryParams), safeRun(favQuery, queryParams)])
      return NextResponse.json({ summary: summaryData, favorites: favData })

    // ── 7. DIVERGENCE ──────────────────────────────────────────────────────
    } else if (action === 'divergence') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        WITH local_broker_agg AS (
          SELECT
            SUM(ba.value)::DOUBLE AS broker_net_val,
            SUM(CASE WHEN ba.value>0 THEN ba.value ELSE 0 END)::DOUBLE AS broker_buy,
            ABS(SUM(CASE WHEN ba.value<0 THEN ba.value ELSE 0 END))::DOUBLE AS broker_sell
          FROM broker_activity ba
          JOIN broker_classification bc ON bc.broker_code = ba.broker_code
          WHERE ${dateFilter.clause}
            AND LEFT(ba.stock_code,4) = $${paramIdx}
            AND LOWER(bc.category) <> 'foreign'
        ),
        foreign_broker_agg AS (
          SELECT
            SUM(ba.value)::DOUBLE AS foreign_broker_net_val,
            SUM(CASE WHEN ba.value>0 THEN ba.value ELSE 0 END)::DOUBLE AS foreign_broker_buy,
            ABS(SUM(CASE WHEN ba.value<0 THEN ba.value ELSE 0 END))::DOUBLE AS foreign_broker_sell
          FROM broker_activity ba
          JOIN broker_classification bc ON bc.broker_code = ba.broker_code
          WHERE ${dateFilter.clause}
            AND LEFT(ba.stock_code,4) = $${paramIdx}
            AND LOWER(bc.category) = 'foreign'
        ),
        foreign_flow_agg AS (
          SELECT
            SUM(net_foreign_value)::DOUBLE  AS foreign_net_val,
            SUM(foreign_buy_value)::DOUBLE  AS foreign_buy,
            SUM(foreign_sell_value)::DOUBLE AS foreign_sell
          FROM market.vw_stock_detail
          WHERE ${dateFilter.clause.replace(/CAST\(date AS DATE\)/g, 'CAST(trading_date AS DATE)')}
            AND stock_code = $${paramIdx}
        )
        SELECT
          COALESCE(lb.broker_net_val, 0)     AS broker_net_val,
          COALESCE(lb.broker_buy, 0)          AS broker_buy,
          COALESCE(lb.broker_sell, 0)         AS broker_sell,
          COALESCE(fb.foreign_broker_net_val, 0) AS foreign_broker_net_val,
          COALESCE(fb.foreign_broker_buy, 0)  AS foreign_broker_buy,
          COALESCE(fb.foreign_broker_sell, 0) AS foreign_broker_sell,
          COALESCE(ff.foreign_net_val, 0)     AS foreign_net_val,
          COALESCE(ff.foreign_buy, 0)         AS foreign_buy,
          COALESCE(ff.foreign_sell, 0)        AS foreign_sell,
          CASE
            WHEN COALESCE(lb.broker_net_val, 0) > 0 AND COALESCE(ff.foreign_net_val, 0) < 0 THEN 'LOCAL_BUY_FOREIGN_SELL'
            WHEN COALESCE(lb.broker_net_val, 0) < 0 AND COALESCE(ff.foreign_net_val, 0) > 0 THEN 'LOCAL_SELL_FOREIGN_BUY'
            WHEN COALESCE(lb.broker_net_val, 0) > 0 AND COALESCE(ff.foreign_net_val, 0) > 0 THEN 'BOTH_BUY'
            WHEN COALESCE(lb.broker_net_val, 0) < 0 AND COALESCE(ff.foreign_net_val, 0) < 0 THEN 'BOTH_SELL'
            ELSE 'NEUTRAL'
          END AS divergence_type
        FROM local_broker_agg lb, foreign_broker_agg fb, foreign_flow_agg ff`

    // ── 8. MULTI-BROKER HISTORY ────────────────────────────────────────────
    } else if (action === 'multi_broker_history') {
      const cleanCode = validateStockCode(code)
      const brokers = brokerCodes.split(',').map(b => b.trim().toUpperCase()).filter(b => b.length > 0)
      if (brokers.length === 0) return NextResponse.json({ error: 'broker_codes diperlukan' }, { status: 400 })
      if (brokers.length > 20) return NextResponse.json({ error: 'Maksimum 20 broker' }, { status: 400 })
      paramIdx++
      const placeholders = brokers.map((_, i) => `$${paramIdx + 1 + i}`).join(', ')
      queryParams.push(cleanCode, ...brokers)
      query = `
        SELECT
          CAST(date AS VARCHAR) AS date,
          broker_code,
          SUM(value)::DOUBLE    AS net_val,
          SUM(lot)::DOUBLE      AS net_lot
        FROM broker_activity
        WHERE ${dateFilter.clause}
          AND LEFT(stock_code,4) = $${paramIdx}
          AND broker_code IN (${placeholders})
        GROUP BY date, broker_code
        ORDER BY date ASC, broker_code ASC`

    // ── 9. SECTOR LIST ─────────────────────────────────────────────────────
    } else if (action === 'sector_list') {
      queryParams = []
      query = `SELECT DISTINCT sector FROM market.company_profile WHERE sector IS NOT NULL AND sector <> '' ORDER BY sector ASC`

    // ── 10. STANCE HISTORY ─────────────────────────────────────────────────
    } else if (action === 'stance_history') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        WITH current_period AS (
          SELECT broker_code, SUM(value)::DOUBLE AS net_val, MAX(broker_name) AS broker_name
          FROM broker_activity
          WHERE ${dateFilter.clause} AND LEFT(stock_code,4) = $${paramIdx}
          GROUP BY broker_code
        ),
        prev_period AS (
          SELECT broker_code, SUM(value)::DOUBLE AS net_val
          FROM broker_activity
          WHERE CAST(date AS DATE) BETWEEN
              ($1::DATE - ($2::DATE - $1::DATE) - INTERVAL '1 day')
              AND ($1::DATE - INTERVAL '1 day')
            AND LEFT(stock_code,4) = $${paramIdx}
          GROUP BY broker_code
        )
        SELECT
          COALESCE(c.broker_code, p.broker_code)     AS broker_code,
          COALESCE(c.broker_name, '')                 AS broker_name,
          COALESCE(c.net_val, 0)::DOUBLE              AS current_net,
          COALESCE(p.net_val, 0)::DOUBLE              AS prev_net,
          CASE
            WHEN COALESCE(p.net_val,0) <= 0 AND COALESCE(c.net_val,0) > 500000000   THEN 'REVERSAL_BUY'
            WHEN COALESCE(p.net_val,0) >= 0 AND COALESCE(c.net_val,0) < -500000000  THEN 'REVERSAL_SELL'
            WHEN COALESCE(p.net_val,0) = 0  AND COALESCE(c.net_val,0) > 0           THEN 'NEW_ENTRANT'
            WHEN COALESCE(c.net_val,0) > 0                                           THEN 'CONTINUATION_BUY'
            WHEN COALESCE(c.net_val,0) < 0                                           THEN 'CONTINUATION_SELL'
            ELSE 'NEUTRAL'
          END AS stance_type
        FROM current_period c
        FULL OUTER JOIN prev_period p ON c.broker_code = p.broker_code
        WHERE COALESCE(c.net_val, 0) <> 0
        ORDER BY ABS(COALESCE(c.net_val, 0)) DESC
        LIMIT 20`

    // ── 11. BROKER INTEL (FIXED) ───────────────────────────────────────────
    } else if (action === 'broker_intel') {
      queryParams = []
      query = `
        WITH latest_date AS (
          SELECT MAX(date) AS max_date FROM main.vw_broker_daily
        ),
        daily_net AS (
          SELECT
            date,
            broker_code,
            COALESCE(buy_value, 0) AS buy_value,
            COALESCE(sell_value, 0) AS sell_value,
            (COALESCE(buy_value, 0) - COALESCE(sell_value, 0)) AS net_val
          FROM main.vw_broker_daily
        ),
        consistency_calc AS (
          SELECT
            broker_code,
            COUNT(*) AS total_days,
            SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END) AS net_buy_days,
            SUM(CASE WHEN net_val < 0 THEN 1 ELSE 0 END) AS net_sell_days,
            (SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0))::DOUBLE AS buy_consistency_pct,
            SUM(buy_value)::DOUBLE AS total_buy,
            SUM(sell_value)::DOUBLE AS total_sell,
            SUM(net_val)::DOUBLE AS all_time_net
          FROM daily_net
          GROUP BY broker_code
        )
        SELECT
          bd.broker_code,
          bd.broker_name,
          COALESCE(bd.buy_value, 0)::DOUBLE            AS buy_value,
          COALESCE(bd.sell_value, 0)::DOUBLE           AS sell_value,
          (COALESCE(bd.buy_value, 0) - COALESCE(bd.sell_value, 0))::DOUBLE AS net_value,
          bd.stock_count::BIGINT                       AS stock_count,
          bd.transaction_count::BIGINT                 AS transaction_count,
          COALESCE(cc.buy_consistency_pct, 0.0)        AS buy_consistency_pct,
          COALESCE(cc.net_buy_days, 0)::BIGINT         AS net_buy_days,
          COALESCE(cc.total_days, 0)::BIGINT           AS total_days,
          COALESCE(cc.total_buy, 0.0)::DOUBLE          AS all_time_buy,
          COALESCE(cc.all_time_net, 0.0)::DOUBLE       AS all_time_net
        FROM main.vw_broker_daily bd
        LEFT JOIN consistency_calc cc ON cc.broker_code = bd.broker_code
        CROSS JOIN latest_date ld
        WHERE bd.date = ld.max_date
        ORDER BY ABS(COALESCE(bd.buy_value, 0) - COALESCE(bd.sell_value, 0)) DESC
        LIMIT 30`

    // ── 12. BROKER BREADTH ─────────────────────────────────────────────────
    } else if (action === 'broker_breadth') {
      queryParams = []
      query = `
        SELECT
          CAST(date AS VARCHAR)   AS date,
          broker_count::BIGINT    AS broker_count,
          stock_count::BIGINT     AS stock_count,
          total_buy::DOUBLE       AS total_buy,
          total_sell::DOUBLE      AS total_sell,
          net_flow::DOUBLE        AS net_flow,
          buy_transactions::BIGINT  AS buy_transactions,
          sell_transactions::BIGINT AS sell_transactions
        FROM main.vw_broker_market_breadth
        ORDER BY date DESC
        LIMIT 30`

    // ── 13. WHALE TIMING ───────────────────────────────────────────────────
    } else if (action === 'whale_timing') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      query = `
        SELECT
          w.share_code,
          w.investor_name,
          w.investor_type,
          w.local_foreign,
          CAST(w.first_seen_date  AS VARCHAR) AS first_seen_date,
          CAST(w.latest_date      AS VARCHAR) AS latest_date,
          w.first_percentage::DOUBLE          AS first_percentage,
          w.latest_percentage::DOUBLE         AS latest_percentage,
          w.latest_shares::BIGINT             AS latest_shares,
          w.est_entry_price::DOUBLE           AS est_entry_price,
          w.current_price::DOUBLE             AS current_price,
          w.return_since_entry::DOUBLE        AS return_since_entry,
          w.holding_days::INTEGER             AS holding_days,
          w.position_trend,
          w.whale_verdict
        FROM ksei.vw_whale_timing w
        WHERE w.share_code = $${paramIdx}
        ORDER BY w.latest_percentage DESC
        LIMIT 15`

    // ── 14. TACTICAL SIGNAL ────────────────────────────────────────────────
    } else if (action === 'tactical_signal') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      const tacticalQuery = `
        SELECT
          stock_code,
          CAST(trading_date AS VARCHAR)       AS trading_date,
          close::DOUBLE                       AS close,
          change_percent::DOUBLE              AS change_percent,
          net_foreign_1d::DOUBLE              AS net_foreign_1d,
          net_foreign_5d::DOUBLE              AS net_foreign_5d,
          broker_net_5d::DOUBLE               AS broker_net_5d,
          tactical_signal
        FROM market.vw_tactical_momentum_smart_money
        WHERE stock_code = $${paramIdx}
        ORDER BY trading_date DESC
        LIMIT 1`
      const stealthQuery = `
        SELECT
          Code                                AS stock_code,
          CAST(Date AS VARCHAR)               AS date,
          Price::DOUBLE                       AS price,
          CP_Flow_Miliar::DOUBLE              AS cp_flow_miliar,
          Foreign_CP_Miliar::DOUBLE           AS foreign_cp_miliar,
          Signal                              AS stealth_signal
        FROM ksei.vw_stealth_accumulation
        WHERE Code = $${paramIdx}
        ORDER BY Date DESC
        LIMIT 1`
      const positionQuery = `
        SELECT
          stock_code,
          total_inst_pct::DOUBLE              AS total_inst_pct,
          prev_inst_pct::DOUBLE               AS prev_inst_pct,
          mom_change_pct::DOUBLE              AS mom_change_pct,
          strategic_signal
        FROM ksei.vw_ksei_inst_positioning
        WHERE stock_code = $${paramIdx}
        LIMIT 1`
      const [tactData, stealthData, posData] = await Promise.all([
        safeRun(tacticalQuery, queryParams),
        safeRun(stealthQuery, queryParams),
        safeRun(positionQuery, queryParams),
      ])
      return NextResponse.json({
        tactical:   tactData[0]  ?? null,
        stealth:    stealthData[0] ?? null,
        positioning: posData[0]  ?? null,
      })

    // ── 15. INSIDER SIGNAL ─────────────────────────────────────────────────
    } else if (action === 'insider_signal') {
      const cleanCode = validateStockCode(code)
      paramIdx++
      queryParams.push(cleanCode)
      const alertQuery = `
        SELECT
          CAST(report_date AS VARCHAR)        AS report_date,
          share_code,
          investor_name,
          investor_type,
          nationality,
          prev_percentage::DOUBLE             AS prev_percentage,
          curr_percentage::DOUBLE             AS curr_percentage,
          pct_point_change::DOUBLE            AS pct_point_change,
          share_change::BIGINT                AS share_change,
          action,
          alert_level
        FROM ksei.vw_ksei_individual_changes
        WHERE share_code = $${paramIdx}
        ORDER BY
          CASE alert_level WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
          report_date DESC
        LIMIT 10`
      const scoreQuery = `
        SELECT
          code,
          corp_change::DOUBLE                 AS corp_change,
          foreign_change::DOUBLE              AS foreign_change,
          ind_change::DOUBLE                  AS ind_change,
          score::INTEGER                      AS insider_score,
          signals
        FROM ksei.vw_insider_screener
        WHERE code = $${paramIdx}
        LIMIT 1`
      const [alerts, scores] = await Promise.all([
        safeRun(alertQuery, queryParams),
        safeRun(scoreQuery, queryParams),
      ])
      return NextResponse.json({
        alerts: alerts,
        score:  scores[0] ?? null,
      })

    // ── 16. SCREENER — materialized table, supports 5d/14d/30d/60d/90d ──────
    } else if (action === 'screener' || action === 'screener_enhanced') {
      const minVal    = parseFloat(minTotalValue)
      const minBrk    = parseInt(minBrokerCount)
      const minBuyBrk = parseInt(minBuyBroker)
      const minPwr    = parseFloat(minPowerScore)
      if (isNaN(minVal)    || minVal    < 0) return NextResponse.json({ error: 'min_total_value tidak valid'     }, { status: 400 })
      if (isNaN(minBrk)    || minBrk    < 1) return NextResponse.json({ error: 'min_broker_count tidak valid'    }, { status: 400 })
      if (isNaN(minBuyBrk) || minBuyBrk < 1) return NextResponse.json({ error: 'min_buy_broker_count tidak valid'}, { status: 400 })
      if (isNaN(minNetMiliar) || minNetMiliar < 0) return NextResponse.json({ error: 'min_net_miliar tidak valid' }, { status: 400 })
      if (isNaN(maxSellPressure) || maxSellPressure < 0 || maxSellPressure > 100) return NextResponse.json({ error: 'max_sell_pressure tidak valid (0-100)' }, { status: 400 })
      const screenerDays = parseInt(searchParams.get('screener_days') || '5')
      const validDays = [5, 14, 30, 60, 90].includes(screenerDays) ? screenerDays : 5
      const tbl = `market.tb_broker_accum_${validDays}d`
      queryParams = []
      paramIdx = 0
      const sectorClause = sector ? `AND sector = $${paramIdx + 1}` : ''
      if (sector) { paramIdx++; queryParams.push(sector) }
      const whaleClause = whaleOnly ? `AND whale_signal = TRUE` : ''
      const p = paramIdx
      queryParams.push(minNetMiliar, maxSellPressure, minVal, minBrk, minBuyBrk, minPwr)
      query = `
        SELECT * FROM ${tbl}
        WHERE net_accumulation > 0
          AND net_miliar >= $${p + 1}
          AND sell_pressure_pct <= $${p + 2}
          AND total_value >= $${p + 3}
          AND broker_count >= $${p + 4}
          AND buy_broker_count >= $${p + 5}
          AND composite_score >= $${p + 6}
          ${sectorClause} ${whaleClause}
        ORDER BY composite_score DESC
        LIMIT 100`

    // ── 18. BROKER ALPHA SCORE ──────────────────────────────────────────────
    } else if (action === 'broker_alpha') {
      queryParams = []
      const daysLookback = searchParams.get('alpha_days') || '30'
      const alphaDays = Math.max(1, Math.min(365, parseInt(daysLookback) || 30))
      query = `
        WITH broker_stock_perf AS (
          SELECT 
            ba.broker_code,
            MAX(ba.broker_name) AS broker_name,
            LEFT(ba.stock_code,4) AS stock_code,
            SUM(CASE WHEN ba.value > 0 THEN ba.value ELSE 0 END)::DOUBLE AS buy_val,
            SUM(ba.value)::DOUBLE AS net_val,
            AVG(dt.change_percent)::DOUBLE AS avg_return,
            COUNT(DISTINCT ba.date) AS days_active
          FROM broker_activity ba
          JOIN market.daily_transactions dt 
            ON dt.stock_code = LEFT(ba.stock_code,4) 
            AND dt.trading_date = ba.date
          WHERE ba.date >= (SELECT COALESCE(MAX(date), CURRENT_DATE) FROM broker_activity) - INTERVAL '${alphaDays} days'
            AND ba.value > 0
          GROUP BY ba.broker_code, LEFT(ba.stock_code,4)
          HAVING SUM(CASE WHEN ba.value > 0 THEN ba.value ELSE 0 END) > 5000000000
        )
        SELECT 
          broker_code,
          MAX(broker_name) AS broker_name,
          COUNT(*) AS stocks_accumulated,
          ROUND(AVG(avg_return), 2)::DOUBLE AS alpha_score,
          SUM(buy_val)::DOUBLE AS total_accumulation,
          SUM(net_val)::DOUBLE AS total_net
        FROM broker_stock_perf
        GROUP BY broker_code
        HAVING COUNT(*) >= 3
        ORDER BY alpha_score DESC
        LIMIT 25`

    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const data = await safeRun(query, queryParams)
    return NextResponse.json({ data })

  } catch (error: any) {
    console.error('[broker-tracker]', { action, message: error.message })
    return NextResponse.json({ error: error.message || 'Gagal mengambil data.' }, { status: 500 })
  }
}
