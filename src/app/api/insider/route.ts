export const dynamic = 'force-dynamic'

// src/app/api/insider/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

function safeRun(query: string, params: any[] = []): Promise<any[]> {
  return run(query, params).catch((err: any) => {
    console.error('[insider] Query failed:', { query: query.substring(0, 200), error: err.message })
    throw new Error(`Query execution failed: ${err.message}`)
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action      = searchParams.get('action')       ?? ''
  const days        = parseInt(searchParams.get('days') ?? '30', 10)
  const actionType  = (searchParams.get('action_type') ?? '').replace(/[^A-Z]/gi, '')
  const insiderType = (searchParams.get('insider_type') ?? '').replace(/[^A-Z]/gi, '')
  const sourceType  = (searchParams.get('source_type') ?? '').replace(/[^A-Z]/gi, '')  // IDX | KSEI | ''
  const realOnly    = searchParams.get('real_only') === 'true'  // exclude MAJOR HOLDER type
  const minPct      = parseFloat(searchParams.get('min_pct') ?? '0')
  const limit       = parseInt(searchParams.get('limit')     ?? '100', 10)

  // Insider type derivation — pakai badges karena is_direksi/komisaris/pengendali tidak reliable
  // Returns: 'PENGENDALI' | 'DIREKSI' | 'KOMISARIS' | 'MAJOR HOLDER'
  const DERIVE_TYPE = `
    CASE
      WHEN is_pengendali OR badges ILIKE '%PENGENDALI%' THEN 'PENGENDALI'
      WHEN is_direksi    OR badges ILIKE '%DIREKTUR%' OR badges ILIKE '%DIREKSI%' THEN 'DIREKSI'
      WHEN is_komisaris  OR badges ILIKE '%KOMISARIS%' THEN 'KOMISARIS'
      ELSE 'MAJOR HOLDER'
    END
  `

  try {

    // ── 1. SUMMARY — KPI cards ───────────────────────────────────────────────
    if (action === 'summary') {
      const srcFilter = sourceType ? `AND source_type = '${sourceType}'` : ''
      const realFilter = realOnly
        ? `AND (is_pengendali OR is_direksi OR is_komisaris
                OR badges ILIKE '%PENGENDALI%' OR badges ILIKE '%DIREKTUR%'
                OR badges ILIKE '%DIREKSI%' OR badges ILIKE '%KOMISARIS%')`
        : ''
      const data = await safeRun(`
        WITH base AS (
          SELECT *,
            ${DERIVE_TYPE} AS derived_type
          FROM main.vw_insider_activity_feed
          WHERE days_ago <= ${days}
            ${srcFilter} ${realFilter}
        )
        SELECT
          COUNT(*)::BIGINT                                            AS total_tx,
          COUNT(CASE WHEN action_type = 'BUY'  THEN 1 END)::BIGINT  AS total_buy,
          COUNT(CASE WHEN action_type = 'SELL' THEN 1 END)::BIGINT  AS total_sell,
          COUNT(DISTINCT stock_code)::BIGINT                         AS unique_stocks,
          COUNT(DISTINCT insider_name)::BIGINT                       AS unique_insiders,
          SUM(CASE WHEN action_type = 'BUY'  THEN est_value_miliar ELSE 0 END)::DOUBLE  AS total_buy_value,
          SUM(CASE WHEN action_type = 'SELL' THEN est_value_miliar ELSE 0 END)::DOUBLE  AS total_sell_value,
          COUNT(CASE WHEN derived_type != 'MAJOR HOLDER' THEN 1 END)::BIGINT AS internal_tx,
          COUNT(CASE WHEN derived_type = 'PENGENDALI' THEN 1 END)::BIGINT   AS pengendali_tx,
          COUNT(CASE WHEN derived_type = 'DIREKSI' THEN 1 END)::BIGINT      AS direksi_tx,
          COUNT(CASE WHEN derived_type = 'KOMISARIS' THEN 1 END)::BIGINT    AS komisaris_tx
        FROM base
      `)
      return NextResponse.json({ data: data[0] ?? null })

    // ── 2. ACTIVITY FEED — recent transactions ───────────────────────────────
    } else if (action === 'feed') {
      const typeClause   = actionType  ? `AND action_type = '${actionType}'`  : ''
      const stockCode    = (searchParams.get('code') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      const stockClause  = stockCode ? `AND stock_code = '${stockCode}'` : ''
      const srcFilter    = sourceType ? `AND source_type = '${sourceType}'` : ''
      const realFilter   = realOnly
        ? `AND (is_pengendali OR is_direksi OR is_komisaris
                OR badges ILIKE '%PENGENDALI%' OR badges ILIKE '%DIREKTUR%'
                OR badges ILIKE '%DIREKSI%' OR badges ILIKE '%KOMISARIS%')`
        : ''
      // legacy insider type filter using derived value
      const insideClause = insiderType === 'INTERNAL'
        ? `AND ${DERIVE_TYPE} != 'MAJOR HOLDER'`
        : insiderType === 'PENGENDALI' ? `AND ${DERIVE_TYPE} = 'PENGENDALI'`
        : insiderType === 'DIREKSI'    ? `AND ${DERIVE_TYPE} = 'DIREKSI'`
        : insiderType === 'KOMISARIS'  ? `AND ${DERIVE_TYPE} = 'KOMISARIS'` : ''

      const data = await safeRun(`
        SELECT
          CAST(transaction_date AS VARCHAR)  AS transaction_date,
          stock_code,
          insider_name,
          ${DERIVE_TYPE}                     AS insider_type,
          action_type,
          shares_change::BIGINT              AS shares_change,
          pct_change::DOUBLE                 AS pct_change,
          pct_previous::DOUBLE               AS pct_previous,
          pct_current::DOUBLE                AS pct_current,
          price_formatted::DOUBLE            AS price_formatted,
          broker_code,
          broker_group,
          source_type,
          badges,
          (is_pengendali OR badges ILIKE '%PENGENDALI%') AS is_pengendali,
          (is_komisaris  OR badges ILIKE '%KOMISARIS%')  AS is_komisaris,
          (is_direksi    OR badges ILIKE '%DIREKTUR%' OR badges ILIKE '%DIREKSI%') AS is_direksi,
          est_value_miliar::DOUBLE           AS est_value_miliar,
          days_ago::INTEGER                  AS days_ago,
          recency_label
        FROM main.vw_insider_activity_feed
        WHERE days_ago <= ${days}
          ${typeClause}
          ${insideClause}
          ${stockClause}
          ${srcFilter} ${realFilter}
        ORDER BY transaction_date DESC, ABS(pct_change) DESC
        LIMIT ${limit}
      `)
      return NextResponse.json({ data })

    // ── 3. SCREENER — insider + market composite ─────────────────────────────
    } else if (action === 'screener') {
      const data = await safeRun(`
        SELECT
          iw.stock_code,
          cp.group_name                       AS company_name,
          cp.sector,
          iw.conviction_score::DOUBLE        AS conviction_score,
          iw.insider_signal,
          CAST(iw.last_insider_date AS VARCHAR) AS last_insider_date,
          iw.insider_tx_count::BIGINT        AS insider_tx_count,
          iw.internal_buy::BIGINT            AS internal_buy,
          iw.internal_sell::BIGINT           AS internal_sell,
          iw.fresh_internal_buy::INTEGER     AS fresh_internal_buy,
          iw.fresh_internal_sell::INTEGER    AS fresh_internal_sell,
          iw.overall_direction,
          iw.direction_30d,
          iw.buy_pressure_pct::DOUBLE        AS buy_pressure_pct,
          iw.net_pct_alltime::DOUBLE         AS net_pct_alltime,
          iw.net_pct_30d::DOUBLE             AS net_pct_30d,
          iw.unique_insiders::BIGINT         AS unique_insiders,
          iw.tx_last30d::BIGINT              AS tx_last30d,
          iw.tx_last7d::BIGINT               AS tx_last7d,
          iw.current_price::DOUBLE           AS current_price,
          iw.price_change_pct::DOUBLE        AS price_change_pct,
          iw.whale_signal,
          iw.market_signal,
          iw.composite_signal,
          iw.free_float::DOUBLE              AS free_float,
          iw.group_name,
          nf.buy_30d::BIGINT                 AS buy_count_30d,
          nf.sell_30d::BIGINT                AS sell_count_30d
        FROM main.vw_insider_with_market iw
        LEFT JOIN market.company_profile   cp ON cp.stock_code = iw.stock_code
        LEFT JOIN main.vw_insider_net_flow_by_stock nf ON nf.stock_code = iw.stock_code
        WHERE iw.insider_tx_count > 0
          ${minPct > 0 ? `AND ABS(iw.net_pct_30d) >= ${minPct}` : ''}
          ${actionType === 'BUY'  ? `AND iw.direction_30d = 'ACCUMULATING'` : ''}
          ${actionType === 'SELL' ? `AND iw.direction_30d = 'DISTRIBUTING'` : ''}
        ORDER BY iw.conviction_score DESC NULLS LAST
        LIMIT ${limit}
      `)
      return NextResponse.json({ data })

    // ── 4. CONVICTION — top stocks by conviction score ────────────────────────
    } else if (action === 'conviction') {
      const data = await safeRun(`
        SELECT
          cs.stock_code,
          cp.group_name                       AS company_name,
          cp.sector,
          CAST(cs.latest_tx AS VARCHAR)      AS latest_tx,
          CAST((CURRENT_DATE - cs.latest_tx) AS INTEGER) AS days_since_tx,
          CASE
            WHEN (CURRENT_DATE - cs.latest_tx) <= 7  THEN 'FRESH'
            WHEN (CURRENT_DATE - cs.latest_tx) <= 30 THEN 'RECENT'
            WHEN (CURRENT_DATE - cs.latest_tx) <= 90 THEN 'AGING'
            ELSE 'STALE'
          END AS recency_tag,
          cs.total_tx::BIGINT                AS total_tx,
          cs.internal_buy::BIGINT            AS internal_buy,
          cs.internal_sell::BIGINT           AS internal_sell,
          cs.score_alltime::DOUBLE           AS score_alltime,
          cs.score_30d::DOUBLE               AS score_30d,
          cs.conviction_score::DOUBLE        AS conviction_score,
          cs.insider_signal,
          cs.fresh_internal_buy::INTEGER     AS fresh_internal_buy,
          cs.fresh_internal_sell::INTEGER    AS fresh_internal_sell,
          sml.close::DOUBLE                  AS current_price,
          sml.change_percent::DOUBLE         AS price_change_pct
        FROM main.vw_insider_conviction_score cs
        LEFT JOIN market.company_profile  cp  ON cp.stock_code  = cs.stock_code
        LEFT JOIN market.vw_stock_latest  sml ON sml.stock_code = cs.stock_code
        WHERE cs.conviction_score IS NOT NULL
        ORDER BY
          CASE
            WHEN (CURRENT_DATE - cs.latest_tx) <= 7  THEN 1
            WHEN (CURRENT_DATE - cs.latest_tx) <= 30 THEN 2
            WHEN (CURRENT_DATE - cs.latest_tx) <= 90 THEN 3
            ELSE 4
          END ASC,
          cs.conviction_score DESC
        LIMIT 100
      `)
      return NextResponse.json({ data })

    // ── 5. ALERT FEED — enriched alerts with price/sector ────────────────────
    } else if (action === 'alerts') {
      const data = await safeRun(`
        SELECT
          CAST(transaction_date AS VARCHAR)  AS transaction_date,
          stock_code,
          insider_name,
          insider_type,
          action_type,
          shares_change::BIGINT              AS shares_change,
          pct_change::DOUBLE                 AS pct_change,
          pct_previous::DOUBLE               AS pct_previous,
          pct_current::DOUBLE                AS pct_current,
          price_formatted::DOUBLE            AS price_formatted,
          broker_code,
          broker_group,
          alert_level,
          est_value_miliar::DOUBLE           AS est_value_miliar,
          days_ago::INTEGER                  AS days_ago,
          current_price::DOUBLE              AS current_price,
          sector,
          market_signal,
          group_name
        FROM main.vw_insider_alert_feed
        WHERE days_ago <= ${days}
        ORDER BY alert_level DESC, transaction_date DESC
        LIMIT ${limit}
      `)
      return NextResponse.json({ data })

    // ── 6. LATEST POSITIONS ───────────────────────────────────────────────────
    } else if (action === 'positions') {
      const code = (searchParams.get('code') ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      const codeClause = code ? `WHERE stock_code = '${code}'` : `WHERE days_since_last_tx <= 90`
      const data = await safeRun(`
        SELECT
          stock_code,
          insider_name,
          CAST(last_transaction_date AS VARCHAR) AS last_transaction_date,
          last_action,
          current_pct_holding::DOUBLE        AS current_pct_holding,
          current_shares::BIGINT             AS current_shares,
          last_pct_change::DOUBLE            AS last_pct_change,
          last_shares_change::BIGINT         AS last_shares_change,
          last_price::DOUBLE                 AS last_price,
          is_pengendali,
          is_komisaris,
          is_direksi,
          badges,
          broker_group,
          nationality,
          insider_type,
          days_since_last_tx::INTEGER        AS days_since_last_tx
        FROM main.vw_insider_latest_position
        ${codeClause}
        ORDER BY days_since_last_tx ASC, ABS(last_pct_change) DESC
        LIMIT ${limit}
      `)
      return NextResponse.json({ data })

    // ── 7. CLUSTER — Insider yang aktif di beberapa saham (powerful pattern!) ─
    // Contoh: INTI ANUGERAH PRATAMA (LPKR, LPLI, LPPS) — group restructuring play
    } else if (action === 'cluster') {
      const data = await safeRun(`
        WITH base AS (
          SELECT
            insider_name,
            stock_code,
            action_type,
            pct_change::DOUBLE AS pct_change,
            transaction_date,
            ${DERIVE_TYPE} AS derived_type,
            cp.group_name,
            cp.sector,
            l.close::DOUBLE AS current_price,
            l.change_percent::DOUBLE AS price_change_pct
          FROM main.vw_insider_activity_feed iaf
          LEFT JOIN market.company_profile cp ON cp.stock_code = iaf.stock_code
          LEFT JOIN market.vw_stock_latest l  ON l.stock_code  = iaf.stock_code
          WHERE days_ago <= ${days}
            AND ABS(pct_change) < 100  -- exclude overflow
            ${sourceType ? `AND source_type = '${sourceType}'` : ''}
        ),
        clusters AS (
          SELECT
            insider_name,
            derived_type,
            COUNT(DISTINCT stock_code)                AS stock_count,
            COUNT(*)                                  AS tx_count,
            COUNT(CASE WHEN action_type = 'BUY'  THEN 1 END)   AS buy_count,
            COUNT(CASE WHEN action_type = 'SELL' THEN 1 END)   AS sell_count,
            STRING_AGG(DISTINCT stock_code, ', ' ORDER BY stock_code) AS stocks,
            STRING_AGG(DISTINCT group_name, ', ' ORDER BY group_name) AS groups,
            STRING_AGG(DISTINCT sector, ', ' ORDER BY sector)         AS sectors,
            ROUND(SUM(CASE WHEN action_type = 'BUY'  THEN pct_change ELSE 0 END)::DOUBLE, 2) AS total_pct_buy,
            ROUND(SUM(CASE WHEN action_type = 'SELL' THEN ABS(pct_change) ELSE 0 END)::DOUBLE, 2) AS total_pct_sell,
            MAX(transaction_date)::VARCHAR                            AS last_tx,
            MIN(transaction_date)::VARCHAR                            AS first_tx,
            CAST(MAX(transaction_date) - MIN(transaction_date) AS INTEGER) AS span_days
          FROM base
          GROUP BY insider_name, derived_type
          HAVING COUNT(DISTINCT stock_code) >= 2
        )
        SELECT *,
          CASE
            WHEN buy_count > 0 AND sell_count = 0 THEN 'CLUSTER ACCUMULATION'
            WHEN sell_count > 0 AND buy_count = 0 THEN 'CLUSTER DISTRIBUTION'
            WHEN buy_count > sell_count THEN 'NET BUY CLUSTER'
            WHEN sell_count > buy_count THEN 'NET SELL CLUSTER'
            ELSE 'MIXED'
          END AS cluster_signal
        FROM clusters
        ORDER BY stock_count DESC, tx_count DESC
        LIMIT 50
      `)
      return NextResponse.json({ data })

    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (err: any) {
    const msg = err.message || String(err)
    console.error('[insider]', { action, message: msg })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
