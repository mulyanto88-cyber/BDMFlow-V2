export const dynamic = 'force-dynamic'

// src/app/api/foreign-flow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

function safeRun(query: string, params: any[] = []): Promise<any[]> {
  return run(query, params).catch((err: any) => {
    console.error('[foreign-flow] Query failed:', { query: query.substring(0, 200), error: err.message })
    throw new Error(`Query execution failed: ${err.message}`)
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action    = searchParams.get('action')
  const code      = searchParams.get('code') || ''
  const sector    = searchParams.get('sector') || ''
  const whaleOnly = searchParams.get('whale_only') === 'true'
  const period    = searchParams.get('period') || '30d' // 1d, 7d, 14d, 30d, 60d, 90d

  try {

    // ── 1. MARKET SUMMARY — 30-day market-wide foreign flow trend ────────────
    if (action === 'market_summary') {
      const data = await safeRun(`
        WITH ld AS (SELECT MAX(trading_date) AS max_date FROM market.daily_transactions)
        SELECT
          CAST(trading_date AS VARCHAR)         AS date,
          SUM(foreign_buy_value)::DOUBLE        AS total_foreign_buy,
          SUM(foreign_sell_value)::DOUBLE       AS total_foreign_sell,
          SUM(net_foreign_value)::DOUBLE        AS net_foreign,
          SUM(value)::DOUBLE                    AS total_market_value,
          COUNT(DISTINCT stock_code)::BIGINT    AS stock_count,
          COUNT(CASE WHEN net_foreign_value > 0 THEN 1 END)::BIGINT AS stocks_bought,
          COUNT(CASE WHEN net_foreign_value < 0 THEN 1 END)::BIGINT AS stocks_sold
        FROM market.daily_transactions, ld
        WHERE trading_date >= ld.max_date - INTERVAL '60 days'
        GROUP BY trading_date
        ORDER BY trading_date ASC
      `)
      return NextResponse.json({ data })

    // ── 2. SECTOR FLOW ───────────────────────────────────────────────────────
    } else if (action === 'sector_flow') {
      const col = ['1d','7d','14d','30d','60d','90d','120d'].includes(period) ? `f${period}` : 'f30d'
      const data = await safeRun(`
        SELECT
          sector,
          COUNT(stock_code)::BIGINT                  AS stock_count,
          SUM(${col})::DOUBLE                         AS total_foreign_flow,
          AVG(change_percent)::DOUBLE                AS avg_change_pct,
          SUM(value)::DOUBLE                         AS total_value,
          COUNT(CASE WHEN whale_signal THEN 1 END)::BIGINT AS whale_count
        FROM market.vw_stock_screener
        WHERE sector IS NOT NULL AND sector <> ''
        GROUP BY sector
        ORDER BY SUM(${col}) DESC
      `)
      return NextResponse.json({ data })

    // ── 3. GROUP FLOW (konglomerat) ──────────────────────────────────────────
    } else if (action === 'group_flow') {
      const col = ['1d','7d','14d','30d','60d','90d','120d'].includes(period) ? `f${period}` : 'f30d'
      const data = await safeRun(`
        SELECT
          group_name,
          SUM(${col})::DOUBLE                         AS total_foreign_30d,
          SUM(value)::DOUBLE                         AS total_value_30d,
          30::BIGINT                                 AS active_days,
          (SUM(${col}) / 30)::DOUBLE                  AS avg_daily_foreign,
          SUM(CASE WHEN ${col} > 0 THEN ${col} ELSE 0 END)::DOUBLE AS inflow,
          SUM(CASE WHEN ${col} < 0 THEN ${col} ELSE 0 END)::DOUBLE AS outflow
        FROM market.vw_stock_screener
        WHERE group_name IS NOT NULL AND group_name <> ''
        GROUP BY group_name
        ORDER BY ABS(SUM(${col})) DESC
        LIMIT 20
      `)
      return NextResponse.json({ data })

    // ── 4. MULTI-PERIOD SCREENER (1D / 7D / 14D / 30D / 60D / 90D / 120D) ──
    } else if (action === 'screener') {
      const groupName  = searchParams.get('group_name') || ''
      const sectorClause = sector    ? `AND sector = $1`        : ''
      const groupClause  = groupName ? `AND company_name = $${sector ? '2' : '1'}` : ''
      const whaleClause  = whaleOnly ? `AND whale_signal = TRUE` : ''
      const params: any[] = []
      if (sector) params.push(sector)
      if (groupName) params.push(groupName)

      const data = await safeRun(`
        SELECT * FROM market.tb_foreign_multiperiod
        WHERE f30d <> 0
          ${sectorClause}
          ${groupClause}
          ${whaleClause}
        ORDER BY ABS(f30d) DESC
        LIMIT 150
      `, params)
      return NextResponse.json({ data })

    // ── 5. STOCK CHART — per-saham harga + daily foreign flow ────────────────
    } else if (action === 'stock_chart') {
      if (!code) return NextResponse.json({ error: 'code diperlukan' }, { status: 400 })
      const c = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
      const daysParam = searchParams.get('days') || '120'
      const days = Math.min(Math.max(parseInt(daysParam) || 120, 30), 730)

      const [chartRows, metricRows] = await Promise.all([
        safeRun(`
          WITH ld AS (SELECT MAX(trading_date) AS max_date FROM market.daily_transactions)
          SELECT
            CAST(trading_date AS VARCHAR)   AS date,
            open_price::DOUBLE              AS open,
            high::DOUBLE                    AS high,
            low::DOUBLE                     AS low,
            close::DOUBLE                   AS close,
            previous::DOUBLE                AS previous,
            change_percent::DOUBLE          AS change_percent,
            net_foreign_value::DOUBLE       AS net_foreign,
            foreign_buy_value::DOUBLE       AS foreign_buy,
            foreign_sell_value::DOUBLE      AS foreign_sell,
            volume::BIGINT                  AS volume,
            value::DOUBLE                   AS market_value
          FROM market.daily_transactions LEFT JOIN market.company_profile USING (stock_code), ld
          WHERE stock_code = $1
            AND trading_date >= ld.max_date - INTERVAL '${days} days'
          ORDER BY trading_date ASC
        `, [c]),

        safeRun(`
          WITH ld AS (SELECT MAX(trading_date) AS max_date FROM market.daily_transactions),
          mp AS (
            SELECT
              stock_code,
              SUM(CASE WHEN trading_date = ld.max_date
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f1d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '7 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f7d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '14 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f14d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '30 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f30d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '60 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f60d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '90 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f90d,
              SUM(CASE WHEN trading_date >= ld.max_date - INTERVAL '120 days'
                       THEN net_foreign_value ELSE 0 END)::DOUBLE  AS f120d
            FROM market.daily_transactions, ld
            WHERE stock_code = $1
              AND trading_date >= ld.max_date - INTERVAL '120 days'
            GROUP BY stock_code
          )
          SELECT
            mp.stock_code,
            cp.group_name                          AS company_name,
            cp.sector,
            mp.f1d, mp.f7d, mp.f14d, mp.f30d,
            mp.f60d, mp.f90d, mp.f120d,
            sms.smart_money_score,
            sms.whale_signal,
            -- local institutional broker net (non-zero-sum); sms.broker_net was zero-sum ≈ 0
            (COALESCE(br.local_inst_net_7d, 0) * 1e9)::DOUBLE AS broker_net,
            sms.signal,
            tact.net_foreign_7d_miliar::DOUBLE     AS tact_foreign_5d,
            COALESCE(br.local_inst_net_7d, 0)::DOUBLE AS broker_net_5d,
            tact.tactical_signal
          FROM mp
          LEFT JOIN market.company_profile                   cp   ON cp.stock_code   = mp.stock_code
          LEFT JOIN market.vw_smart_money_score              sms  ON sms.stock_code  = mp.stock_code
          LEFT JOIN market.vw_tactical_momentum_smart_money  tact ON tact.stock_code = mp.stock_code
          LEFT JOIN main.vw_broker_rolling_net               br   ON br.stock_code   = mp.stock_code
        `, [c])
      ])
      return NextResponse.json({ chart: chartRows, metrics: metricRows[0] ?? null })

    // ── 6. DIVERGENCE RADAR ──────────────────────────────────────────────────
    } else if (action === 'divergence') {
      const data = await safeRun(`
        SELECT
          sms.stock_code,
          cp.group_name                          AS company_name,
          cp.sector,
          sms.close::DOUBLE                      AS close,
          sms.change_percent::DOUBLE             AS change_percent,
          sms.foreign_30d::DOUBLE                AS foreign_30d,
          -- LOCAL axis = local institutional broker net (non-zero-sum). sms.broker_net was
          -- SUM(value) of ALL brokers = zero-sum ≈ 0, making the old divergence patterns noise.
          (COALESCE(br.local_inst_net_7d, 0) * 1e9)::DOUBLE AS broker_net,
          sms.whale_signal,
          sms.big_player_anomaly,
          sms.smart_money_score,
          sms.signal,
          tact.net_foreign_1d::DOUBLE            AS net_foreign_1d,
          tact.net_foreign_7d_miliar::DOUBLE     AS net_foreign_5d,
          COALESCE(br.local_inst_net_7d, 0)::DOUBLE AS broker_net_5d,
          tact.tactical_signal,
          CASE
            WHEN sms.foreign_30d > 0 AND COALESCE(br.local_inst_net_7d,0) > 0 AND sms.whale_signal = TRUE THEN 'TRIPLE_BUY'
            WHEN sms.foreign_30d > 0 AND COALESCE(br.local_inst_net_7d,0) > 0                             THEN 'BOTH_BUY'
            WHEN sms.foreign_30d > 0 AND COALESCE(br.local_inst_net_7d,0) < 0                             THEN 'FOREIGN_BUY_LOCAL_SELL'
            WHEN sms.foreign_30d < 0 AND COALESCE(br.local_inst_net_7d,0) > 0                             THEN 'LOCAL_BUY_FOREIGN_SELL'
            WHEN sms.foreign_30d < 0 AND COALESCE(br.local_inst_net_7d,0) < 0                             THEN 'BOTH_SELL'
            ELSE 'NEUTRAL'
          END AS divergence_pattern
        FROM market.vw_smart_money_score sms
        LEFT JOIN market.company_profile                   cp   ON cp.stock_code  = sms.stock_code
        LEFT JOIN market.vw_tactical_momentum_smart_money  tact ON tact.stock_code = sms.stock_code
        LEFT JOIN main.vw_broker_rolling_net               br   ON br.stock_code  = sms.stock_code
        WHERE ABS(sms.foreign_30d) > 500000000
        ORDER BY ABS(sms.foreign_30d) DESC
        LIMIT 120
      `)
      return NextResponse.json({ data })

    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (err: any) {
    console.error('[foreign-flow]', { action, message: err.message })
    return NextResponse.json({ error: err.message ?? 'Gagal mengambil data.' }, { status: 500 })
  }
}
