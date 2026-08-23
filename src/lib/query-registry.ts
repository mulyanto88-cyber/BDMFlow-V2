// ============================================================
// src/lib/query-registry.ts
// Server-side named-query registry.
//
// WHY THIS EXISTS
// The browser used to POST raw SQL strings to /api/motherduck. That forced the
// endpoint to stay open to arbitrary SELECTs, which meant anyone could dump the
// whole proprietary dataset, and it published our schema inside the JS bundle.
//
// Now the client sends only a query ID + params. The SQL lives here, on the
// server, and can never be supplied by a caller.
//
// ADDING A QUERY
//   1. Add an entry below with a stable, namespaced id ("sector.stocks").
//   2. Declare `params` — the exact number of $1..$n placeholders.
//   3. Mark `arrayParams` for any placeholder bound to a string[] (must be cast
//      in the SQL, e.g. `= ANY($1::VARCHAR[])`).
//   4. Set `pro: true` if the data is a paid-tier feature.
// ============================================================

export type QueryDef = {
  /** Parameterized SQL. Only $1..$n placeholders — never string interpolation. */
  sql: string
  /** Exact number of parameters this query expects. Defaults to 0. */
  params?: number
  /** 0-based indices of parameters bound as string arrays. */
  arrayParams?: number[]
  /** Paid-tier data. Enforced by requirePlan() in the API route. */
  pro?: boolean
}

export const QUERIES = {
  // ── Sector ────────────────────────────────────────────────────────────────
  'sector.analytics': {
    sql: `SELECT * FROM market.tb_sector_analytics ORDER BY momentum_score DESC NULLS LAST`,
  },
  'sector.stocks': {
    sql: `
      SELECT stock_code, close, change_percent, net_foreign_value, value,
             whale_signal, big_player_anomaly, aov_ratio_ma20, volume, ma20_volume
      FROM market.tb_stock_latest
      WHERE sector = $1
      ORDER BY value DESC NULLS LAST LIMIT 50`,
    params: 1,
  },

  // ── Smart Money ───────────────────────────────────────────────────────────
  'smartMoney.instPositioning': {
    sql: `SELECT * FROM ksei.tb_ksei_inst_positioning ORDER BY mom_change_pct DESC NULLS LAST LIMIT 50`,
    pro: true,
  },
  'smartMoney.scores': {
    sql: `
      SELECT s.stock_code, s.sector, s.close, s.change_percent, s.foreign_30d, s.broker_net,
             s.whale_signal, s.big_player_anomaly, s.aov_ratio_ma20,
             ROUND((COALESCE(v2.v2_score,0) / 73.0 * 100)::NUMERIC, 0) AS smart_money_score,
             CASE
               WHEN ROUND((COALESCE(v2.v2_score,0) / 73.0 * 100)::NUMERIC, 0) >= 70 THEN '🚀 STRONG BUY'
               WHEN ROUND((COALESCE(v2.v2_score,0) / 73.0 * 100)::NUMERIC, 0) >= 45 THEN '👀 WATCH'
               ELSE '➖ NEUTRAL'
             END AS signal
      FROM market.tb_smart_money_score s
      LEFT JOIN market.tb_composite_v2 v2 ON v2.stock_code = s.stock_code
      ORDER BY smart_money_score DESC NULLS LAST, s.aov_ratio_ma20 DESC NULLS LAST
      LIMIT 50`,
    pro: true,
  },
  'smartMoney.tactical': {
    sql: `
      SELECT * FROM market.tb_tactical_momentum_smart_money
      WHERE ABS(net_foreign_7d_miliar * 1e9) > CAST($1 AS FLOAT8)
         OR ABS(broker_net_7d_miliar * 1e9)  > CAST($1 AS FLOAT8)
      ORDER BY ABS(net_foreign_7d_miliar) DESC NULLS LAST, ABS(broker_net_7d_miliar) DESC NULLS LAST
      LIMIT 50`,
    params: 1,
    pro: true,
  },
  'smartMoney.tacticalByCode': {
    sql: `SELECT * FROM market.tb_tactical_momentum_smart_money WHERE stock_code = $1`,
    params: 1,
    pro: true,
  },
  'smartMoney.instPositioningByCode': {
    sql: `SELECT * FROM ksei.tb_ksei_inst_positioning WHERE stock_code = $1`,
    params: 1,
    pro: true,
  },

  // ── Screener ──────────────────────────────────────────────────────────────
  'screener.allInOne': {
    sql: `
      SELECT
        s.stock_code, s.sector, s.close, s.change_percent, s.smart_money_score,
        s.whale_signal, s.big_player_anomaly, s.signal,
        s.tier_v2, s.flow_context,
        s.aov_max_1d,  s.aov_max_7d,  s.aov_max_14d,  s.aov_max_30d,  s.aov_max_90d,
        s.spike_1d,    s.spike_7d,    s.spike_14d,    s.spike_30d,    s.spike_90d,
        s.foreign_1d,  s.foreign_7d,  s.foreign_14d,  s.foreign_30d,  s.foreign_90d,
        COALESCE(r.radar_score, 0)               AS radar_score,
        COALESCE(r.foreign_broker_net_7d, 0)     AS foreign_broker_net_7d,
        COALESCE(r.local_inst_net_7d, 0)         AS local_inst_net_7d,
        COALESCE(r.ksei_net_smart_miliar, 0)     AS ksei_net_smart_miliar,
        COALESCE(r.fresh_insider_buy, false)     AS fresh_insider_buy,
        COALESCE(l.value, 0)                     AS daily_value,
        COALESCE(l.vwma_20d, 0)                  AS vwma_20d
      FROM market.tb_screener_allinone s
      LEFT JOIN market.tb_radar r ON s.stock_code = r.stock_code
      LEFT JOIN market.tb_stock_latest    l ON s.stock_code = l.stock_code
      WHERE r.warning_flag IS NULL`,
    pro: true,
  },

  // ── Watchlist ─────────────────────────────────────────────────────────────
  // Was string-interpolating stock codes into an IN (...) list; now a bound array.
  'watchlist.radarByCodes': {
    sql: `
      SELECT stock_code, close::FLOAT8 AS close,
             ROUND((change_percent::FLOAT8)::NUMERIC,2) AS change_percent,
             composite_signal, radar_score::INTEGER AS radar_score
      FROM market.tb_radar
      WHERE stock_code = ANY($1::VARCHAR[])`,
    params: 1,
    arrayParams: [0],
    pro: true,
  },

  // ── Groups ────────────────────────────────────────────────────────────────
  'groups.leaderLaggard': {
    sql: `SELECT * FROM market.tb_group_leader_laggard WHERE group_name = $1 ORDER BY relative_perf DESC NULLS LAST`,
    params: 1,
  },
  'groups.brokerStance': {
    sql: `
      SELECT broker_code, broker_name, net_7d_miliar, net_30d_miliar,
             stocks_7d, buy_consensus_pct, broker_consensus, rotation_signal
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY broker_code ORDER BY net_7d_miliar DESC NULLS LAST) AS rn
        FROM market.tb_group_broker_stance
        WHERE group_name = $1
      ) t
      WHERE rn = 1
      ORDER BY net_7d_miliar DESC NULLS LAST`,
    params: 1,
  },
  'groups.kseiMonthly': {
    sql: `
      SELECT TO_CHAR(Date,'Mon') AS bulan,
        ROUND(((SUM(Local_CP_Chg_Val)+SUM(Local_PF_Chg_Val)+SUM(Local_IB_Chg_Val))/1e9)::NUMERIC,2) AS local_smart,
        ROUND(((SUM(Foreign_CP_Chg_Val)+SUM(Foreign_PF_Chg_Val)+SUM(Foreign_IB_Chg_Val))/1e9)::NUMERIC,2) AS foreign_smart,
        ROUND((SUM(Local_ID_Chg_Val)/1e9)::NUMERIC,2) AS retail
      FROM ksei.monthly_snapshot ms
      JOIN market.company_profile cp ON ms.Code = cp.stock_code
      WHERE cp.group_name = $1
        AND ms.Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot) - INTERVAL '90 days'
      GROUP BY Date ORDER BY Date`,
    params: 1,
  },
  'groups.foreignFlow30d': {
    sql: `
      WITH ld AS (SELECT MAX(trading_date) AS max_date FROM market.daily_transactions)
      SELECT
        CAST(dt.trading_date AS VARCHAR) AS date,
        SUM(dt.net_foreign_value)::BIGINT / 1e9 AS net_foreign,
        SUM(dt.value)::BIGINT / 1e9 AS total_value
      FROM market.daily_transactions dt
      JOIN market.company_profile cp ON dt.stock_code = cp.stock_code
      CROSS JOIN ld
      WHERE cp.group_name = $1
        AND dt.trading_date >= ld.max_date - INTERVAL '30 days'
      GROUP BY dt.trading_date
      ORDER BY dt.trading_date ASC`,
    params: 1,
  },
  'groups.catchup': {
    sql: `
      WITH latest AS (
        SELECT MAX(trading_date) AS max_date FROM market.daily_transactions
      ),
      stock_daily AS (
        SELECT
          d.stock_code,
          d.close,
          d.change_percent,
          d.net_foreign_value,
          d.whale_signal,
          d.aov_ratio_ma20,
          cp.group_name,
          cp.sector,
          cp.free_float
        FROM market.daily_transactions d
        JOIN market.company_profile cp ON d.stock_code = cp.stock_code
        WHERE d.trading_date = (SELECT max_date FROM latest)
          AND cp.group_name != 'Others'
      ),
      group_avg AS (
        SELECT
          group_name,
          ROUND((AVG(change_percent))::NUMERIC, 2)  AS grp_avg_chg,
          ROUND((AVG(aov_ratio_ma20))::NUMERIC, 2)  AS grp_avg_aov,
          COUNT(*)                        AS grp_stocks
        FROM stock_daily
        GROUP BY group_name
      ),
      group_perf_20d AS (
        SELECT
          cp.group_name,
          ROUND((AVG(d.change_percent))::NUMERIC, 2) AS perf_20d
        FROM market.daily_transactions d
        JOIN market.company_profile cp ON d.stock_code = cp.stock_code
        WHERE d.trading_date >= (SELECT max_date FROM latest) - INTERVAL '30 days'
          AND cp.group_name != 'Others'
        GROUP BY cp.group_name
      ),
      ksei_sm AS (
        SELECT
          ms.Code,
          ROUND(((ms.Local_CP_Chg_Val + ms.Local_PF_Chg_Val + ms.Local_IB_Chg_Val
               + ms.Foreign_CP_Chg_Val + ms.Foreign_PF_Chg_Val + ms.Foreign_IB_Chg_Val)
               / 1e9)::NUMERIC, 2) AS ksei_smart_miliar
        FROM ksei.monthly_snapshot ms
        WHERE ms.Date = (SELECT MAX(Date) FROM ksei.monthly_snapshot)
      ),
      broker_net AS (
        -- smart-broker net (FOREIGN + LOCAL_INST), non-zero-sum.
        -- SUM(value) over ALL brokers ≈ 0 (zero-sum tape) — was meaningless.
        SELECT
          ba.stock_code AS stock_code,
          ROUND((SUM(ba.value) / 1e9)::NUMERIC, 2)
            AS broker_net_miliar
        FROM main.broker_activity ba
        JOIN main.broker_classification bc ON bc.broker_code = ba.broker_code
        WHERE ba.date >= (SELECT max_date FROM latest) - INTERVAL '7 days'
          AND UPPER(bc.category) IN ('FOREIGN','LOCAL_INST')
          AND LENGTH(ba.stock_code) = 4
        GROUP BY ba.stock_code
      )
      SELECT
        s.stock_code,
        s.sector,
        s.close,
        ROUND((s.change_percent)::NUMERIC, 2)              AS change_pct,
        g.grp_avg_chg,
        ROUND((s.change_percent - g.grp_avg_chg)::NUMERIC, 2) AS relative_perf,
        s.whale_signal,
        ROUND((s.net_foreign_value / 1e6)::NUMERIC, 2)     AS net_foreign_juta,
        s.free_float,
        s.group_name,
        g.grp_stocks,
        COALESCE(p.perf_20d, 0)                 AS group_perf_20d,
        COALESCE(k.ksei_smart_miliar, 0)        AS ksei_smart_miliar,
        COALESCE(b.broker_net_miliar, 0)        AS broker_net_miliar,
        CASE
          WHEN (COALESCE(k.ksei_smart_miliar, 0) > 0 AND COALESCE(b.broker_net_miliar, 0) > 0)
            THEN 'HIGH'
          WHEN (COALESCE(k.ksei_smart_miliar, 0) > 0 OR s.whale_signal
                OR COALESCE(b.broker_net_miliar, 0) > 0)
            THEN 'MEDIUM'
          ELSE 'LOW'
        END AS catchup_conviction
      FROM stock_daily s
      JOIN group_avg        g ON s.group_name = g.group_name
      JOIN group_perf_20d   p ON s.group_name = p.group_name
      LEFT JOIN ksei_sm     k ON s.stock_code  = k.Code
      LEFT JOIN broker_net  b ON s.stock_code  = b.stock_code
      WHERE
        (s.change_percent - g.grp_avg_chg) <= -$1
        AND COALESCE(p.perf_20d, 0) > 0
        AND (
          COALESCE(k.ksei_smart_miliar, 0) > 0
          OR s.whale_signal
          OR COALESCE(b.broker_net_miliar, 0) > 0
        )
      ORDER BY
        CASE WHEN (COALESCE(k.ksei_smart_miliar,0) > 0 AND COALESCE(b.broker_net_miliar,0) > 0)
             THEN 0 ELSE 1 END,
        (s.change_percent - g.grp_avg_chg) ASC
      LIMIT 25`,
    params: 1,
  },
  'groups.multiPeriodPerf': {
    sql: `
      SELECT
        mp.group_name,
        COALESCE(pc.total_stocks, 0)              AS total_stocks,
        mp.perf_1d,
        mp.perf_5d_avg,
        mp.perf_20d_avg,
        mp.perf_60d_avg,
        mp.value_1d_miliar,
        mp.avg_val_5d_miliar,
        mp.avg_val_20d_miliar,
        mp.foreign_net_1d_miliar,
        mp.foreign_net_5d_miliar,
        mp.foreign_net_20d_miliar,
        mp.foreign_net_60d_miliar,
        mp.whale_1d,
        mp.anomaly_1d,
        mp.momentum_state,
        mp.foreign_flow_trend,
        mp.rs_vs_market_1d,
        COALESCE(pc.composite_score, 0)            AS composite_score,
        COALESCE(pc.market_phase, 'SIDEWAYS')      AS market_phase,
        COALESCE(pc.group_action_signal, 'WATCH')  AS group_action_signal,
        COALESCE(pc.ksei_conviction_score, 0)      AS ksei_conviction_score,
        COALESCE(pc.foreign_30d_miliar, 0)         AS foreign_30d_miliar,
        COALESCE(pc.total_smart_miliar, 0)         AS total_smart_miliar,
        COALESCE(pc.local_smart_miliar, 0)         AS local_smart_miliar,
        COALESCE(pc.foreign_smart_miliar, 0)       AS foreign_smart_miliar,
        COALESCE(pc.local_retail_miliar, 0)        AS local_retail_miliar,
        COALESCE(pc.local_cp_miliar, 0)            AS local_cp_miliar,
        COALESCE(pc.local_pf_miliar, 0)            AS local_pf_miliar,
        COALESCE(pc.local_ib_miliar, 0)            AS local_ib_miliar,
        COALESCE(pc.foreign_cp_miliar, 0)          AS foreign_cp_miliar,
        COALESCE(pc.smart_money_trend, '')         AS smart_money_trend,
        COALESCE(pc.divergence_signal, '')         AS divergence_signal,
        COALESCE(pc.konsisten_3_bulan, FALSE)      AS konsisten_3_bulan,
        COALESCE(pc.institution_alignment, '')     AS institution_alignment,
        COALESCE(pc.broker_buy_pct, 0)             AS broker_buy_pct,
        COALESCE(pc.broker_consensus, '')          AS broker_consensus,
        COALESCE(pc.broker_net_7d_miliar, 0)       AS broker_net_7d_miliar,
        COALESCE(pc.whale_count, 0)                AS whale_count,
        COALESCE(pc.group_top_buyer, '')           AS group_top_buyer
      FROM market.tb_group_multi_period_perf mp
      LEFT JOIN market.tb_group_phase_composite pc ON mp.group_name = pc.group_name
      ORDER BY mp.foreign_net_1d_miliar DESC NULLS LAST`,
  },

  // ── KSEI >1% ──────────────────────────────────────────────────────────────
  'ksei.insiderScreener': {
    sql: `SELECT * FROM ksei.tb_insider_screener ORDER BY score DESC NULLS LAST`,
    pro: true,
  },
  'ksei.individualChanges': {
    sql: `
      SELECT report_date::VARCHAR AS report_date, share_code, investor_name, investor_type,
             nationality, prev_percentage, curr_percentage, pct_point_change,
             share_change, action, alert_level
      FROM ksei.tb_ksei_individual_changes
      ORDER BY report_date DESC NULLS LAST, ABS(pct_point_change) DESC NULLS LAST
      LIMIT 500`,
    pro: true,
  },
  'ksei.whaleTiming': {
    sql: `SELECT * FROM ksei.tb_whale_timing ORDER BY ABS(return_since_entry) DESC NULLS LAST LIMIT 100`,
    pro: true,
  },
  // Latest KSEI month only, with corporate-action months excluded — see the note
  // in api/morning-brief/route.ts. Ranking all history surfaced stale rows and
  // share-count artifacts (the impossible "-52 T" CP flow).
  'ksei.stealthAccumulation': {
    sql: `
      WITH latest AS (SELECT MAX(Date) AS d FROM ksei.tb_stealth_accumulation),
      shares AS (
        SELECT Code, Date, Price, Total_Shares,
               LAG(Total_Shares) OVER (PARTITION BY Code ORDER BY Date) AS prev_shares
        FROM ksei.monthly_snapshot
      )
      SELECT sa.*, sa.Date::VARCHAR AS as_of
      FROM ksei.tb_stealth_accumulation sa
      CROSS JOIN latest l
      LEFT JOIN shares sh ON sh.Code = sa.Code AND sh.Date = sa.Date
      WHERE sa.Date = l.d
        AND (sh.prev_shares IS NULL OR sh.prev_shares = 0
             OR ABS(sh.Total_Shares::FLOAT8 / sh.prev_shares - 1) <= 0.05)
        AND (sh.Price IS NULL OR sh.Total_Shares IS NULL OR sh.Total_Shares = 0
             OR ABS(sa.CP_Flow_Miliar) * 1e9 <= sh.Price * sh.Total_Shares)
      ORDER BY ABS(sa.CP_Flow_Miliar) DESC NULLS LAST LIMIT 100`,
    pro: true,
  },
  'ksei.topInvestors': {
    sql: `SELECT * FROM ksei.tb_top_investors ORDER BY total_saham DESC NULLS LAST LIMIT 50`,
    pro: true,
  },
  'ksei.monthlySnapshotLatest': {
    sql: `
      SELECT Code, Date::VARCHAR AS Date, Price::FLOAT8 AS Price, Total_Shares::BIGINT AS Total_Shares,
             Top_Buyer, ROUND(((Top_Buyer_Val/1e9)::FLOAT8)::NUMERIC,3) AS Top_Buyer_Miliar,
             Top_Seller, ROUND(((Top_Seller_Val/1e9)::FLOAT8)::NUMERIC,3) AS Top_Seller_Miliar,
             ROUND(((Local_CP_Chg_Val/1e9)::FLOAT8)::NUMERIC,3) AS CP_Flow_Miliar,
             ROUND((((Foreign_CP_Chg_Val+Foreign_IB_Chg_Val+Foreign_PF_Chg_Val)/1e9)::FLOAT8)::NUMERIC,3) AS Foreign_Flow_Miliar
      FROM ksei.monthly_snapshot
      WHERE Date = (SELECT MAX(Date) FROM ksei.monthly_snapshot)
        AND (ABS(Local_CP_Chg_Val) > 1e9 OR ABS(Foreign_CP_Chg_Val) > 1e9)
      ORDER BY ABS(Local_CP_Chg_Val) DESC NULLS LAST LIMIT 50`,
    pro: true,
  },
  'ksei.ownershipByCode': {
    sql: `
      SELECT investor_name, investor_type, local_foreign, percentage, total_holding_shares
      FROM ksei.ownership_1pct
      WHERE share_code = $1 AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
      ORDER BY percentage DESC NULLS LAST`,
    params: 1,
    pro: true,
  },
  'ksei.changesByCode': {
    sql: `SELECT * FROM ksei.tb_ksei_individual_changes WHERE share_code = $1 ORDER BY ABS(pct_point_change) DESC NULLS LAST LIMIT 50`,
    params: 1,
    pro: true,
  },
  'ksei.ownershipHistoryByCode': {
    sql: `
      SELECT date,
        SUM(CASE WHEN local_foreign IN ('L','D') THEN percentage ELSE 0 END) AS local_pct,
        SUM(CASE WHEN local_foreign = 'F' THEN percentage ELSE 0 END) AS foreign_pct,
        COUNT(DISTINCT investor_name) AS investor_count
      FROM ksei.ownership_1pct
      WHERE share_code = $1
      GROUP BY date ORDER BY date ASC LIMIT 12`,
    params: 1,
    pro: true,
  },
  'ksei.profileByCode': {
    sql: `SELECT sector, free_float FROM ksei.tb_ownership_1pct_latest WHERE share_code = $1 LIMIT 1`,
    params: 1,
    pro: true,
  },
  'ksei.holdingsByInvestor': {
    sql: `
      SELECT share_code, percentage, total_holding_shares
      FROM ksei.ownership_1pct
      WHERE investor_name = $1
        AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
      ORDER BY percentage DESC NULLS LAST`,
    params: 1,
    pro: true,
  },

  // ── Backtest ──────────────────────────────────────────────────────────────
  'backtest.tradingDates': {
    sql: `
      SELECT DISTINCT CAST(trading_date AS VARCHAR) AS trading_date
      FROM market.daily_transactions
      WHERE stock_code = 'COMPOSITE' OR stock_code = 'BBCA'
      ORDER BY trading_date DESC
      LIMIT 120`,
    pro: true,
  },
  'backtest.signalPerformance': {
    sql: `
      WITH t0_stocks AS (
        SELECT
          dt.stock_code,
          dt.trading_date AS t0_date,
          dt.close AS t0_close,
          dt.value AS t0_value,
          dt.volume AS t0_volume,
          dt.net_foreign_value AS t0_foreign,
          dt.aov_ratio_ma20 AS t0_aov,
          dt.whale_signal AS t0_whale,
          dt.big_player_anomaly AS t0_bp,
          cp.company_name,
          cp.sector
        FROM market.daily_transactions dt
        LEFT JOIN market.company_profile cp ON cp.stock_code = dt.stock_code
        WHERE CAST(dt.trading_date AS VARCHAR) = $1
          AND dt.stock_code != 'COMPOSITE'
          AND dt.close > 0
          AND (
            ($2 = 'AOV_SURGE' AND dt.aov_ratio_ma20 >= 1.5)
            OR ($2 = 'AOV_EXTREME' AND dt.aov_ratio_ma20 >= 2.5)
            OR ($2 = 'WHALE_ALERT' AND (dt.whale_signal = true OR dt.big_player_anomaly = true))
            OR ($2 = 'BIG_PLAYER' AND dt.big_player_anomaly = true)
            OR ($2 = 'FOREIGN_INFLOW' AND dt.net_foreign_value > 0)
            OR ($2 = 'COMBINED_WHALE_FOREIGN' AND (dt.whale_signal = true OR dt.aov_ratio_ma20 >= 1.5) AND dt.net_foreign_value > 0)
            OR ($2 = 'TRIPLE_POWER' AND dt.whale_signal = true AND dt.aov_ratio_ma20 >= 1.5 AND dt.net_foreign_value > 0)
            OR ($2 = 'RADAR_MOMENTUM' AND dt.aov_ratio_ma20 >= 1.2 AND dt.change_percent >= 1.5 AND dt.net_foreign_value > 0)
            OR ($2 = 'ACCUM_BREAKOUT' AND dt.close >= dt.open_price AND dt.change_percent > 0 AND (dt.whale_signal = true OR dt.aov_ratio_ma20 >= 1.3))
            OR ($2 = 'ALL')
          )
        ORDER BY
          CASE 
            WHEN $2 IN ('AOV_SURGE', 'AOV_EXTREME') THEN dt.aov_ratio_ma20 
            WHEN $2 = 'FOREIGN_INFLOW' THEN dt.net_foreign_value 
            ELSE NULL 
          END DESC NULLS LAST,
          dt.value DESC NULLS LAST
        LIMIT CAST($3 AS INTEGER)
      ),
      forward_prices AS (
        SELECT
          dt.stock_code,
          dt.trading_date,
          (CASE WHEN COALESCE(dt.open_price, 0) > 0 THEN dt.open_price WHEN COALESCE(dt.previous, 0) > 0 THEN dt.previous ELSE dt.close END) AS open_price,
          (CASE WHEN COALESCE(dt.high, 0) > 0 THEN dt.high WHEN COALESCE(dt.previous, 0) > 0 THEN GREATEST(dt.close, dt.previous) ELSE dt.close END) AS high,
          (CASE WHEN COALESCE(dt.low, 0) > 0 THEN dt.low WHEN COALESCE(dt.previous, 0) > 0 THEN LEAST(dt.close, dt.previous) ELSE dt.close END) AS low,
          dt.close,
          ROW_NUMBER() OVER (PARTITION BY dt.stock_code ORDER BY dt.trading_date ASC) AS day_num,
          ROW_NUMBER() OVER (PARTITION BY dt.stock_code ORDER BY dt.trading_date DESC) AS rn_latest
        FROM market.daily_transactions dt
        JOIN t0_stocks t0 ON t0.stock_code = dt.stock_code
        WHERE dt.trading_date >= CAST($1 AS DATE)
          AND dt.close > 0
      ),
      stock_aggregates AS (
        SELECT
          fp.stock_code,
          MAX(CASE WHEN fp.high > 0 THEN fp.high ELSE fp.close END) AS max_high,
          MIN(CASE WHEN fp.low > 0 THEN fp.low ELSE fp.close END) AS min_low,
          COUNT(*) AS trading_days_count,
          MAX(CASE WHEN fp.rn_latest = 1 THEN fp.close ELSE NULL END) AS latest_close,
          MAX(CASE WHEN fp.rn_latest = 1 THEN CAST(fp.trading_date AS VARCHAR) ELSE NULL END) AS latest_date
        FROM forward_prices fp
        WHERE fp.close > 0
        GROUP BY fp.stock_code
      )
      SELECT
        t0.stock_code,
        COALESCE(t0.company_name, '') AS company_name,
        COALESCE(t0.sector, 'Stock') AS sector,
        CAST(t0.t0_date AS VARCHAR) AS entry_date,
        t0.t0_close::FLOAT8 AS entry_price,
        t0.t0_value::FLOAT8 AS entry_value,
        t0.t0_foreign::FLOAT8 AS entry_foreign,
        t0.t0_aov::FLOAT8 AS entry_aov,
        t0.t0_whale AS entry_whale,
        sa.latest_date,
        sa.latest_close::FLOAT8 AS latest_price,
        sa.max_high::FLOAT8 AS max_high,
        sa.min_low::FLOAT8 AS min_low,
        sa.trading_days_count::INTEGER AS days_held,
        ROUND(((sa.latest_close - t0.t0_close) / NULLIF(t0.t0_close, 0) * 100)::NUMERIC, 2)::FLOAT8 AS current_return_pct,
        ROUND(((sa.max_high - t0.t0_close) / NULLIF(t0.t0_close, 0) * 100)::NUMERIC, 2)::FLOAT8 AS max_gain_pct,
        ROUND(((sa.min_low - t0.t0_close) / NULLIF(t0.t0_close, 0) * 100)::NUMERIC, 2)::FLOAT8 AS max_drawdown_pct
      FROM t0_stocks t0
      JOIN stock_aggregates sa ON sa.stock_code = t0.stock_code
      ORDER BY current_return_pct DESC`,
    params: 3,
    pro: true,
  },
  'backtest.forwardPricePath': {
    sql: `
      SELECT dt.stock_code, CAST(dt.trading_date AS VARCHAR) AS date, dt.close::FLOAT8 AS close
      FROM market.daily_transactions dt
      WHERE dt.stock_code = ANY($1::VARCHAR[])
        AND dt.trading_date >= CAST($2 AS DATE)
      ORDER BY dt.stock_code, dt.trading_date ASC`,
    params: 2,
    arrayParams: [0],
    pro: true,
  },
  'backtest.pricesAll': {
    sql: `
      SELECT trading_date, open_price, high, low, close,
             whale_signal, net_foreign_value, aov_ratio_ma20, big_player_anomaly
      FROM market.daily_transactions
      WHERE stock_code = $1
      ORDER BY trading_date ASC`,
    params: 1,
    pro: true,
  },
  'backtest.pricesRange': {
    sql: `
      SELECT trading_date, open_price, high, low, close,
             net_foreign_value, aov_ratio_ma20, whale_signal, big_player_anomaly
      FROM market.daily_transactions
      WHERE stock_code = $1 AND trading_date >= $2 AND trading_date <= $3
      ORDER BY trading_date ASC LIMIT 1000`,
    params: 3,
    pro: true,
  },
  'backtest.compositeRange': {
    sql: `
      SELECT trading_date, close
      FROM market.daily_transactions
      WHERE stock_code = 'COMPOSITE' AND trading_date >= $1 AND trading_date <= $2
      ORDER BY trading_date ASC LIMIT 1000`,
    params: 2,
    pro: true,
  },

  // ── Data quality ──────────────────────────────────────────────────────────
  // Unadjusted corporate actions. The exchange restates `previous` on the ex-date,
  // so a 1:20 split reports a normal change_percent while `close` drops ~95%.
  // Any return computed from raw closes across that date is fiction — which is how
  // MLPT surfaced as a BUY on a fake -93% return while is_split_suspect said false.
  'market.corporateActions': {
    sql: `
      WITH bounds AS (
        SELECT MAX(CAST(trading_date AS DATE)) AS maxd FROM market.daily_transactions
      ),
      recent AS (
        SELECT dt.stock_code, dt.trading_date, dt.close, dt.change_percent
        FROM market.daily_transactions dt CROSS JOIN bounds b
        WHERE CAST(dt.trading_date AS DATE) >= b.maxd - INTERVAL '120 days'
          AND dt.close > 0
      ),
      d AS (
        SELECT stock_code, trading_date, close, change_percent,
               LAG(close) OVER (PARTITION BY stock_code ORDER BY trading_date) AS prev_close
        FROM recent
      )
      SELECT
        stock_code,
        trading_date::VARCHAR                  AS event_date,
        prev_close::FLOAT8                     AS prev_close,
        close::FLOAT8                          AS close,
        ROUND((close / NULLIF(prev_close,0))::NUMERIC, 4) AS close_ratio,
        CASE WHEN close < prev_close THEN 'SPLIT_OR_BONUS' ELSE 'REVERSE_SPLIT' END AS action_kind
      FROM d
      WHERE prev_close > 0
        AND ABS((close / prev_close - 1) * 100 - change_percent) > 40
      ORDER BY trading_date DESC NULLS LAST`,
  },

  // ── Shared chrome (ticker, search) ────────────────────────────────────────
  'ticker.top': {
    sql: `
      SELECT stock_code, close, change_percent
      FROM market.tb_stock_latest
      WHERE value > 1000000000
      ORDER BY ABS(change_percent) DESC NULLS LAST
      LIMIT 20`,
  },
  'search.stocks': {
    sql: `
      SELECT stock_code, sector, close, change_percent
      FROM market.tb_stock_latest
      WHERE stock_code ILIKE $1
      ORDER BY value DESC NULLS LAST
      LIMIT 8`,
    params: 1,
  },
} satisfies Record<string, QueryDef>

export type QueryId = keyof typeof QUERIES

export function getQuery(id: string): QueryDef | null {
  return Object.prototype.hasOwnProperty.call(QUERIES, id)
    ? (QUERIES as Record<string, QueryDef>)[id]
    : null
}

/** A parameter value the client is allowed to bind. */
type Scalar = string | number | boolean | null

function isScalar(v: unknown): v is Scalar {
  return v === null || ['string', 'number', 'boolean'].includes(typeof v)
}

/**
 * Validate caller-supplied params against a query definition.
 * Returns an error string, or null when the params are acceptable.
 */
export function validateParams(def: QueryDef, params: unknown[]): string | null {
  const expected = def.params ?? 0
  if (params.length !== expected) {
    return `Query membutuhkan ${expected} parameter, menerima ${params.length}.`
  }
  const arrayIdx = new Set(def.arrayParams ?? [])

  for (let i = 0; i < params.length; i++) {
    const v = params[i]
    if (arrayIdx.has(i)) {
      if (!Array.isArray(v) || v.length === 0 || v.length > 500) {
        return `Parameter ke-${i + 1} harus berupa array (1–500 item).`
      }
      if (!v.every((x) => typeof x === 'string' && x.length <= 64)) {
        return `Parameter ke-${i + 1} harus berisi teks (maks 64 karakter).`
      }
      continue
    }
    if (!isScalar(v)) {
      return `Parameter ke-${i + 1} harus berupa teks, angka, boolean, atau null.`
    }
    if (typeof v === 'string' && v.length > 200) {
      return `Parameter ke-${i + 1} terlalu panjang (maks 200 karakter).`
    }
  }
  return null
}
