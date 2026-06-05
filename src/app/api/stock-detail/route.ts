export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code   = (searchParams.get('code') || '').toUpperCase().trim().replace(/[^A-Z0-9]/g, '')
  const days   = Math.min(parseInt(searchParams.get('days') || '90'), 1095)
  const action = searchParams.get('action') || ''

  if (!code || code.length < 1 || code.length > 10) {
    return NextResponse.json({ error: 'Kode saham tidak valid' }, { status: 400 })
  }

  // ── Tab: Broker DNA (Command Center) ──────────────────────────────────────
  if (action === 'broker_dna') {
    try {
      const [rolling, topBuyers, topSellers] = await Promise.all([
        run(`
          SELECT
            ROUND(foreign_broker_net_1d::DOUBLE, 3)  AS foreign_broker_net_1d,
            ROUND(foreign_broker_net_7d::DOUBLE, 3)  AS foreign_broker_net_7d,
            ROUND(foreign_broker_net_30d::DOUBLE, 3) AS foreign_broker_net_30d,
            ROUND(prime_broker_net_7d::DOUBLE, 3)    AS prime_broker_net_7d,
            ROUND(local_inst_net_1d::DOUBLE, 3)      AS local_inst_net_1d,
            ROUND(local_inst_net_7d::DOUBLE, 3)      AS local_inst_net_7d,
            ROUND(local_inst_net_30d::DOUBLE, 3)     AS local_inst_net_30d,
            ROUND(retail_net_1d::DOUBLE, 3)          AS retail_net_1d,
            ROUND(retail_net_7d::DOUBLE, 3)          AS retail_net_7d,
            foreign_brokers_buying_7d::BIGINT        AS foreign_brokers_buying_7d,
            local_inst_brokers_buying_7d::BIGINT     AS local_inst_brokers_buying_7d
          FROM main.vw_broker_rolling_net WHERE stock_code = $1
        `, [code]).catch(() => []),
        run(`
          SELECT ba.broker_code, MAX(ba.broker_name) AS broker_name,
            COALESCE(bc.category, 'LOCAL_RETAIL') AS category,
            COALESCE(bc.is_prime, false)::BOOLEAN AS is_prime,
            ROUND(SUM(CASE WHEN ba.side='BUY' THEN ba.value ELSE 0 END) / 1e9, 3) AS buy_miliar,
            ROUND(SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END) / 1e9, 3) AS sell_miliar,
            ROUND(SUM(ba.value) / 1e9, 3) AS net_miliar
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.stock_code = $1
            AND ba.date >= (SELECT MAX(date) FROM main.broker_activity) - INTERVAL '7 days'
          GROUP BY ba.broker_code, bc.category, bc.is_prime
          ORDER BY net_miliar DESC LIMIT 10
        `, [code]).catch(() => []),
        run(`
          SELECT ba.broker_code, MAX(ba.broker_name) AS broker_name,
            COALESCE(bc.category, 'LOCAL_RETAIL') AS category,
            ROUND(SUM(ba.value) / 1e9, 3) AS net_miliar
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.stock_code = $1
            AND ba.date >= (SELECT MAX(date) FROM main.broker_activity) - INTERVAL '7 days'
          GROUP BY ba.broker_code, bc.category
          ORDER BY net_miliar ASC LIMIT 5
        `, [code]).catch(() => []),
      ])
      return NextResponse.json({ rolling: rolling[0] ?? null, topBuyers, topSellers })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── Tab: KSEI Monthly Intelligence (Command Center) ────────────────────────
  if (action === 'ksei_monthly') {
    try {
      const [trend, composition] = await Promise.all([
        run(`
          SELECT
            Date::VARCHAR AS date,
            Price::INTEGER AS price,
            ROUND((Local_CP_Chg_Val+Local_PF_Chg_Val+Local_IB_Chg_Val
                  +Foreign_CP_Chg_Val+Foreign_PF_Chg_Val+Foreign_IB_Chg_Val) / 1e9, 3) AS net_smart_miliar,
            ROUND(Local_ID_Chg_Val / 1e9, 3)   AS retail_miliar,
            ROUND((Local_CP_Chg_Val+Local_PF_Chg_Val+Local_IB_Chg_Val) / 1e9, 3)      AS local_smart_miliar,
            ROUND((Foreign_CP_Chg_Val+Foreign_PF_Chg_Val+Foreign_IB_Chg_Val) / 1e9, 3) AS foreign_smart_miliar,
            ROUND(Local_CP_Chg_Val / 1e9, 3) AS cp_flow,
            ROUND(Local_PF_Chg_Val / 1e9, 3) AS pf_flow,
            ROUND(Local_IB_Chg_Val / 1e9, 3) AS ib_flow
          FROM ksei.monthly_snapshot
          WHERE Code = $1 ORDER BY Date DESC LIMIT 12
        `, [code]).catch(() => []),
        run(`
          SELECT
            ROUND((Total_Local::DOUBLE / NULLIF(Total_Shares,0)) * 100, 2) AS Local_Pct,
            ROUND((Total_Foreign::DOUBLE / NULLIF(Total_Shares,0)) * 100, 2) AS Foreign_Pct,
            ROUND((Local_CP::DOUBLE / NULLIF(Total_Shares,0)) * 100, 2) AS Local_CP_Pct,
            ROUND((Foreign_CP::DOUBLE / NULLIF(Total_Shares,0)) * 100, 2) AS Foreign_CP_Pct,
            ROUND((Local_ID::DOUBLE / NULLIF(Total_Shares,0)) * 100, 2) AS Local_ID_Pct
          FROM ksei.monthly_snapshot
          WHERE Code = $1 AND Date = (SELECT MAX(Date) FROM ksei.monthly_snapshot)
          LIMIT 1
        `, [code]).catch(() => []),
      ])
      return NextResponse.json({ trend, composition: composition[0] ?? null })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  // ── Tab: Conviction Verdict (Command Center) ────────────────────────────────
  if (action === 'conviction') {
    try {
      const data = await run(`
        SELECT
          stock_code, radar_score::INTEGER AS radar_score,
          composite_signal, market_signal,
          ROUND(foreign_broker_net_7d::DOUBLE, 2) AS foreign_broker_net_7d,
          ROUND(local_inst_net_7d::DOUBLE, 2)     AS local_inst_net_7d,
          ROUND(ksei_net_smart_miliar::DOUBLE, 2) AS ksei_net_smart_miliar,
          insider_conviction_score::INTEGER        AS insider_conviction_score,
          insider_signal, whale_signal::BOOLEAN,
          big_player_anomaly::BOOLEAN,
          ROUND(aov_ratio_ma20::DOUBLE, 2)         AS aov_ratio_ma20,
          fresh_insider_buy::BOOLEAN, fresh_insider_sell::BOOLEAN,
          is_split_suspect::BOOLEAN, is_reverse_suspect::BOOLEAN
        FROM market.vw_stock_multi_signal
        WHERE stock_code = $1
        LIMIT 1
      `, [code]).catch(() => [])
      return NextResponse.json({ data: data[0] ?? null })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  if (!code || code.length < 1 || code.length > 10) {
    return NextResponse.json({ error: 'Kode saham tidak valid' }, { status: 400 })
  }

  // ── Latest stock info ─────────────────────────────────────────────────────
  if (action === 'latest') {
    const rows = await run(`
      SELECT stock_code, trading_date::VARCHAR, close::DOUBLE, change_percent::DOUBLE,
             previous::DOUBLE, high::DOUBLE, low::DOUBLE, open_price::DOUBLE,
             volume::BIGINT, value::DOUBLE, net_foreign_value::DOUBLE,
             vwma_20d::DOUBLE, aov_ratio_ma20::DOUBLE,
             whale_signal::BOOLEAN, big_player_anomaly::BOOLEAN, signal,
             sector, free_float::DOUBLE, group_name, tradeable_shares::BIGINT
      FROM market.vw_stock_detail
      WHERE stock_code = $1
      ORDER BY trading_date DESC LIMIT 1
    `, [code]).catch(() => [])
    return NextResponse.json({ data: rows[0] ?? null })
  }

  // ── Price chart history ───────────────────────────────────────────────────
  if (action === 'chart') {
    const rows = await run(`
      SELECT trading_date::VARCHAR, open_price::DOUBLE, high::DOUBLE, low::DOUBLE,
             close::DOUBLE, volume::BIGINT, net_foreign_value::DOUBLE,
             vwma_20d::DOUBLE, aov_ratio_ma20::DOUBLE,
             whale_signal::BOOLEAN, big_player_anomaly::BOOLEAN
      FROM market.daily_transactions
      WHERE stock_code = $1
        AND CAST(trading_date AS DATE) >= (SELECT MAX(CAST(trading_date AS DATE)) FROM market.daily_transactions) - INTERVAL '${days} days'
      ORDER BY trading_date ASC
    `, [code]).catch(() => [])
    return NextResponse.json({ data: rows })
  }

  // ── Insider signal + KSEI individual changes ──────────────────────────────
  if (action === 'insider_signal') {
    const [alerts, score] = await Promise.all([
      run(`
        SELECT report_date::VARCHAR, share_code, investor_name, investor_type,
               nationality, prev_percentage::DOUBLE, curr_percentage::DOUBLE,
               pct_point_change::DOUBLE, share_change::BIGINT, action, alert_level
        FROM ksei.vw_ksei_individual_changes
        WHERE share_code = $1
        ORDER BY report_date DESC LIMIT 20
      `, [code]).catch(() => []),
      run(`
        SELECT conviction_score::BIGINT, insider_signal, internal_buy::BIGINT,
               internal_sell::BIGINT, fresh_internal_buy::BOOLEAN, fresh_internal_sell::BOOLEAN,
               latest_tx::VARCHAR, total_tx::BIGINT
        FROM main.vw_insider_conviction_score
        WHERE stock_code = $1 LIMIT 1
      `, [code]).catch(() => []),
    ])
    return NextResponse.json({ alerts, score: score[0] ?? null })
  }

  // ── >1% ownership ─────────────────────────────────────────────────────────
  if (action === 'ownership') {
    const rows = await run(`
      SELECT investor_name, investor_type, local_foreign, nationality,
             percentage::DOUBLE, total_holding_shares::BIGINT, holdings_scripless::BIGINT
      FROM ksei.ownership_1pct
      WHERE share_code = $1
        AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
      ORDER BY percentage DESC LIMIT 50
    `, [code]).catch(() => [])
    return NextResponse.json({ data: rows })
  }

  // ── Whale timing ──────────────────────────────────────────────────────────
  if (action === 'whale_timing') {
    const rows = await run(`
      SELECT investor_name, investor_type, local_foreign,
             first_seen_date::VARCHAR, latest_date::VARCHAR,
             first_percentage::DOUBLE, latest_percentage::DOUBLE,
             latest_shares::BIGINT, est_entry_price::DOUBLE, current_price::DOUBLE,
             return_since_entry::DOUBLE, holding_days::INTEGER,
             position_trend, whale_verdict
      FROM ksei.whale_timing_snapshot
      WHERE share_code = $1
      ORDER BY latest_percentage DESC LIMIT 20
    `, [code]).catch(() => [])
    return NextResponse.json({ data: rows })
  }

  // ── Volume spike history ──────────────────────────────────────────────────
  if (action === 'volume_spike') {
    const rows = await run(`
      SELECT trading_date::VARCHAR, close::DOUBLE, volume::BIGINT,
             ma20_volume::BIGINT,
             ROUND((volume::DOUBLE / NULLIF(ma20_volume,0)),2)::DOUBLE AS volume_ratio,
             change_percent::DOUBLE, net_foreign_value::DOUBLE,
             whale_signal::BOOLEAN, aov_ratio_ma20::DOUBLE,
             CASE
               WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 2.0 AND change_percent > 0 THEN '🚀 BREAKOUT'
               WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 2.0 AND change_percent < 0 THEN '🔻 BREAKDOWN'
               WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 1.5 THEN '📊 HIGH VOL'
               ELSE 'NORMAL'
             END AS spike_type
      FROM market.daily_transactions
      WHERE stock_code = $1
        AND CAST(trading_date AS DATE) >= (SELECT MAX(CAST(trading_date AS DATE)) FROM market.daily_transactions) - INTERVAL '90 days'
        AND ma20_volume > 0
      ORDER BY trading_date DESC
    `, [code]).catch(() => [])
    return NextResponse.json({ data: rows })
  }

  if (action) {
    return NextResponse.json({ error: 'Unknown action', action }, { status: 400 })
  }

  // No specific action → return full stock detail package
  try {
    // Batch 1 — Core data (7 queries)
    let latestRows: any[] = [], smRows: any[] = [], histRows: any[] = [], brokerRows: any[] = [],
        ownerRows: any[] = [], whaleRows: any[] = [], foreignRows: any[] = [];
    try {
      [latestRows, smRows, histRows, brokerRows, ownerRows, whaleRows, foreignRows] = await Promise.all([
      
      // 1. Latest stock data
      run(`SELECT * FROM market.vw_stock_detail WHERE stock_code = $1 ORDER BY trading_date DESC LIMIT 1`, [code]),
      
      // 2. Smart Money Score
      run(`SELECT * FROM market.vw_smart_money_score WHERE stock_code = $1`, [code]),
      
      // 3. Chart history — FIX: CAST trading_date AS DATE
      run(`
        SELECT trading_date, open_price, high, low, close, volume,
               net_foreign_value, vwma_20d, aov_ratio_ma20,
               whale_signal, big_player_anomaly, previous
        FROM market.daily_transactions
        WHERE stock_code = $1
          AND CAST(trading_date AS DATE) >= (SELECT CAST(MAX(trading_date) AS DATE) FROM market.daily_transactions) - INTERVAL '${days} days'
        ORDER BY trading_date ASC
      `, [code]),
      
      // 4. Broker Activity — FIX: CAST date AS DATE
      run(`
        SELECT broker_code AS kode_broker, MAX(broker_name) AS nama_broker,
               SUM(value)::DOUBLE AS net_value
        FROM main.broker_activity
        WHERE LEFT(stock_code, 4) = $1
          AND CAST(date AS DATE) >= (SELECT CAST(MAX(date) AS DATE) FROM main.broker_activity) - INTERVAL '90 days'
        GROUP BY broker_code
        ORDER BY ABS(SUM(value)) DESC
        LIMIT 6
      `, [code]),
      
      // 5. Ownership Details
      run(`
        SELECT investor_name, investor_type, local_foreign, percentage, total_holding_shares
        FROM ksei.ownership_1pct
        WHERE share_code = $1
          AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
        ORDER BY percentage DESC
        LIMIT 100
      `, [code]),
      
      // 6. Whale Movement
      run(`SELECT * FROM ksei.whale_timing_snapshot WHERE share_code = $1`, [code]),
      
      // 7. Foreign Divergence
      run(`
        WITH ranked AS (
          SELECT trading_date, close, change_percent, net_foreign_value,
                 ROW_NUMBER() OVER (ORDER BY trading_date DESC) AS rn
          FROM market.daily_transactions
          WHERE stock_code = $1
        ),
        agg AS (
          SELECT
            SUM(net_foreign_value) AS foreign_30d_net,
            MAX(CASE WHEN rn = 1 THEN close END) AS price_now,
            MAX(CASE WHEN rn = 30 THEN close END) AS price_30d_ago,
            MAX(CASE WHEN rn = 1 THEN change_percent END) AS latest_chg_pct
          FROM ranked WHERE rn <= 30
        )
        SELECT
          foreign_30d_net,
          latest_chg_pct AS price_chg_pct,
          ROUND(((price_now - price_30d_ago) / NULLIF(price_30d_ago, 0)) * 100, 2) AS price_chg_30d,
          CASE
            WHEN foreign_30d_net > 1e9 AND latest_chg_pct BETWEEN -1 AND 1 THEN 'STEALTH ACCUMULATION'
            WHEN foreign_30d_net > 1e9 AND latest_chg_pct > 1 THEN 'BULLISH CONFIRMATION'
            WHEN foreign_30d_net < -1e9 AND latest_chg_pct > 1 THEN 'DISTRIBUTION'
            WHEN foreign_30d_net < -1e9 AND latest_chg_pct < -1 THEN 'BEARISH PRESSURE'
            ELSE 'NEUTRAL'
          END AS divergence_type,
          CASE
            WHEN ABS(foreign_30d_net) > 50e9 THEN 'STRONG'
            WHEN ABS(foreign_30d_net) > 10e9 THEN 'MODERATE'
            ELSE 'WEAK'
          END AS signal_strength,
          CASE
            WHEN foreign_30d_net > 1e9 AND latest_chg_pct BETWEEN -1 AND 1
              THEN 'Foreign akumulasi diam-diam, harga belum gerak – potensi breakout.'
            WHEN foreign_30d_net > 1e9 AND latest_chg_pct > 1
              THEN 'Foreign beli dan harga naik, konfirmasi momentum bullish.'
            WHEN foreign_30d_net < -1e9 AND latest_chg_pct > 1
              THEN 'Foreign jual tapi harga naik – waspadai distribusi terselubung.'
            WHEN foreign_30d_net < -1e9 AND latest_chg_pct < -1
              THEN 'Foreign jual dan harga turun, tekanan jual masih berlanjut.'
            ELSE 'Aliran foreign relatif netral dalam 30 hari terakhir.'
          END AS interpretation
        FROM agg
      `, [code]),
      ])
    } catch (e: any) {
      console.error('[stock-detail] Batch 1 failed:', e.message)
    }

    if (!latestRows.length) {
      const errMsg = 'Stock tidak ditemukan atau data pasar tidak tersedia. Pastikan kode saham benar (contoh: BBCA).'
      return NextResponse.json({ error: errMsg }, { status: 404 })
    }

    // Batch 2 — Rich data (7 queries)
    let flowTrendRows: any[] = [], concRows: any[] = [], instChangeRows: any[] = [],
        stealthRows: any[] = [], brokerConsRows: any[] = [],
        volSpikeRows: any[] = [], whaleActRows: any[] = [];
    try {
      [flowTrendRows, concRows, instChangeRows, stealthRows, brokerConsRows, volSpikeRows, whaleActRows] = await Promise.all([
      run(`
        SELECT
          CAST(trading_date AS VARCHAR) AS trading_date,
          net_foreign_value,
          close,
          SUM(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_flow,
          AVG(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 4 PRECEDING AND CURRENT ROW) AS flow_ma5,
          AVG(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) AS flow_ma20,
          CASE
            WHEN SUM(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) >= 10e9 AND net_foreign_value >= 0 THEN 'STRONG_ACCUMULATION'
            WHEN SUM(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) > 0 THEN 'MILD_ACCUMULATION'
            WHEN SUM(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) <= -10e9 AND net_foreign_value <= 0 THEN 'STRONG_DISTRIBUTION'
            WHEN SUM(net_foreign_value) OVER (ORDER BY trading_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW) < 0 THEN 'MILD_DISTRIBUTION'
            ELSE 'NEUTRAL'
          END AS trend
        FROM market.daily_transactions
        WHERE stock_code = $1
          AND CAST(trading_date AS DATE) >= (SELECT CAST(MAX(trading_date) AS DATE) FROM market.daily_transactions) - 60
        ORDER BY trading_date ASC
      `, [code]),

      // 9. Concentration Index
      run(`
        WITH latest AS (
          SELECT MAX(date) AS max_date FROM ksei.ownership_1pct
          WHERE share_code = $1
        ),
        ranked AS (
          SELECT
            percentage,
            ROW_NUMBER() OVER (ORDER BY percentage DESC) AS rn,
            COUNT(*) OVER () AS total_count
          FROM ksei.ownership_1pct
          WHERE share_code = $1 AND date = (SELECT max_date FROM latest)
        )
        SELECT
          $1 AS stock_code,
          SUM(percentage * percentage) AS hhi_score,
          SUM(CASE WHEN rn <= 5 THEN percentage ELSE 0 END) AS top5_pct,
          SUM(CASE WHEN rn <= 10 THEN percentage ELSE 0 END) AS top10_pct,
          MAX(total_count) AS total_investor_count,
          CASE
            WHEN SUM(percentage * percentage) >= 2500 THEN 'Highly Concentrated'
            WHEN SUM(percentage * percentage) >= 1500 THEN 'Moderately Concentrated'
            ELSE 'Diversified'
          END AS concentration_label
        FROM ranked
      `, [code]),

      // 10. Institutional Change (6M)
      run(`
        SELECT
          CAST(report_date AS VARCHAR) AS report_date,
          investor_name,
          investor_type,
          prev_percentage,
          curr_percentage,
          pct_point_change,
          action,
          alert_level
        FROM ksei.vw_ksei_individual_changes
        WHERE share_code = $1
        ORDER BY report_date DESC
        LIMIT 20
      `, [code]),

      // 11. Stealth vs Foreign Divergence (proper)
      run(`
        WITH latest_sa AS (
          SELECT Code, Date, Price, CP_Flow_Miliar, Foreign_CP_Miliar, Signal
          FROM ksei.vw_stealth_accumulation
          WHERE Code = $1
          ORDER BY Date DESC LIMIT 1
        ),
        flow_30d AS (
          SELECT
            SUM(net_foreign_value)::DOUBLE AS foreign_net_30d,
            SUM(foreign_buy_value)::DOUBLE AS foreign_buy_30d,
            SUM(foreign_sell_value)::DOUBLE AS foreign_sell_30d
          FROM market.vw_stock_detail
          WHERE stock_code = $1
            AND trading_date >= (SELECT MAX(trading_date) FROM market.vw_stock_detail) - INTERVAL '30 days'
        ),
        broker_net AS (
          SELECT SUM(value)::DOUBLE AS broker_net_30d
          FROM main.broker_activity
          WHERE LEFT(stock_code, 4) = $1
            AND date >= (SELECT CAST(MAX(date) AS DATE) FROM main.broker_activity) - 30
        )
        SELECT
          COALESCE(sa.Signal, 'NORMAL') AS stealth_signal,
          COALESCE(sa.CP_Flow_Miliar, 0) AS cp_flow_miliar,
          COALESCE(sa.Foreign_CP_Miliar, 0) AS foreign_cp_miliar,
          COALESCE(f.foreign_net_30d, 0) AS foreign_net_30d,
          COALESCE(b.broker_net_30d, 0) AS broker_net_30d,
          CASE
            WHEN sa.Signal = 'STEALTH_ACCUMULATION' AND COALESCE(f.foreign_net_30d, 0) < 0 THEN 'STEALTH_ACCUM_VS_FOREIGN_OUT'
            WHEN sa.Signal = 'STEALTH_ACCUMULATION' AND COALESCE(f.foreign_net_30d, 0) > 0 THEN 'BOTH_ACCUMULATING'
            WHEN sa.Signal = 'STEALTH_DISTRIBUTION' AND COALESCE(f.foreign_net_30d, 0) > 0 THEN 'SMART_DISTRIB_VS_FOREIGN_IN'
            WHEN sa.Signal = 'DIP_BUYING' THEN 'VALUE_BUYING'
            WHEN COALESCE(f.foreign_net_30d, 0) > 0 AND COALESCE(b.broker_net_30d, 0) < 0 THEN 'BROKER_SELL_FOREIGN_BUY'
            WHEN COALESCE(f.foreign_net_30d, 0) < 0 AND COALESCE(b.broker_net_30d, 0) > 0 THEN 'BROKER_BUY_FOREIGN_SELL'
            ELSE 'NEUTRAL'
          END AS divergence_type,
          CASE
            WHEN ABS(COALESCE(f.foreign_net_30d, 0)) > 50e9 THEN 'STRONG'
            WHEN ABS(COALESCE(f.foreign_net_30d, 0)) > 10e9 THEN 'MODERATE'
            ELSE 'WEAK'
          END AS signal_strength,
          CASE
            WHEN sa.Signal = 'STEALTH_ACCUMULATION' AND COALESCE(f.foreign_net_30d, 0) < 0
              THEN 'Stealth CP buying tapi foreign masih jual — akumulasi diam-diam. Waspadai potensi reversal.'
            WHEN sa.Signal = 'STEALTH_ACCUMULATION' AND COALESCE(f.foreign_net_30d, 0) > 0
              THEN 'CP + Foreign akumulasi bersamaan — sinyal bullish kuat, konfirmasi institusional.'
            WHEN sa.Signal = 'DIP_BUYING'
              THEN 'CP beli saat harga turun — value hunting. Momentum jangka pendek positif.'
            WHEN COALESCE(f.foreign_net_30d, 0) > 0 AND COALESCE(b.broker_net_30d, 0) < 0
              THEN 'Foreign beli tapi broker lokal jual — distribusi ke retail. Hati-hati.'
            WHEN COALESCE(f.foreign_net_30d, 0) < 0 AND COALESCE(b.broker_net_30d, 0) > 0
              THEN 'Broker lokal beli tapi foreign jual — potensi pembalikan lokal. Konfirmasi dengan volume.'
            ELSE 'Tidak ada divergensi signifikan. Aliran cenderung seimbang.'
          END AS interpretation
        FROM latest_sa sa, flow_30d f, broker_net b
      `, [code]),

      // 12. Broker Consistency (30D)
      run(`
        WITH daily AS (
          SELECT
            broker_code,
            MAX(broker_name) AS nama_broker,
            CAST(date AS DATE) AS d,
            SUM(value)::DOUBLE AS net_val,
            SUM(ABS(value))::DOUBLE AS total_val
          FROM main.broker_activity
          WHERE LEFT(stock_code, 4) = $1
            AND CAST(date AS DATE) >= (SELECT CAST(MAX(date) AS DATE) FROM main.broker_activity) - 30
          GROUP BY broker_code, CAST(date AS DATE)
        ),
        stats AS (
          SELECT
            broker_code,
            MAX(nama_broker) AS nama_broker,
            COUNT(*) AS total_days,
            SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END) AS days_net_buy,
            SUM(CASE WHEN net_val < 0 THEN 1 ELSE 0 END) AS days_net_sell,
            ROUND(SUM(CASE WHEN net_val > 0 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0), 1) AS consistency_pct,
            SUM(total_val)::DOUBLE AS total_val
          FROM daily
          GROUP BY broker_code
          HAVING COUNT(*) >= 3
        )
        SELECT
          broker_code AS kode_broker,
          nama_broker,
          total_days,
          days_net_buy,
          days_net_sell,
          consistency_pct,
          total_val,
          CASE
            WHEN consistency_pct >= 80 AND days_net_buy >= 5 THEN 'STRONG_BUY'
            WHEN consistency_pct >= 60 AND days_net_buy > days_net_sell THEN 'CONSISTENT_BUY'
            WHEN consistency_pct >= 80 AND days_net_sell >= 5 THEN 'STRONG_SELL'
            WHEN consistency_pct >= 60 AND days_net_sell > days_net_buy THEN 'CONSISTENT_SELL'
            ELSE 'MIXED'
          END AS verdict
        FROM stats
        ORDER BY total_val DESC
        LIMIT 15
      `, [code]),

      // 13. Volume Spike Alerts — langsung dari daily_transactions (konsisten dgn Volume & AOV screener)
      run(`
        SELECT
          CAST(trading_date AS VARCHAR) AS trading_date,
          close::DOUBLE AS close,
          volume::BIGINT AS volume,
          ma20_volume::BIGINT AS ma20_volume,
          ROUND((volume::DOUBLE / NULLIF(ma20_volume,0)),2)::DOUBLE AS volume_ratio,
          change_percent::DOUBLE AS change_percent,
          net_foreign_value::DOUBLE AS net_foreign_value,
          whale_signal::BOOLEAN,
          CASE
            WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 2.0 AND change_percent > 0 THEN 'BREAKOUT'
            WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 2.0 AND change_percent < 0 THEN 'BREAKDOWN'
            WHEN (volume::DOUBLE / NULLIF(ma20_volume,0)) >= 1.5 THEN 'HIGH_VOLUME'
            ELSE 'NORMAL'
          END AS spike_type
        FROM market.daily_transactions
        WHERE stock_code = $1
          AND CAST(trading_date AS DATE) >= (SELECT MAX(CAST(trading_date AS DATE)) FROM market.daily_transactions) - INTERVAL '90 days'
        ORDER BY trading_date DESC
        LIMIT 15
      `, [code]),

      // 14. Whale Activity Summary
      run(`
        SELECT
          total_days,
          whale_days,
          anomaly_days,
          whale_pct,
          total_foreign,
          avg_price,
          avg_aov_ratio
        FROM market.vw_whale_activity
        WHERE stock_code = $1
        LIMIT 1
      `, [code]),
      ])
    } catch (e: any) {
      console.error('[stock-detail] Batch 2 failed:', e.message)
    }

    if (!latestRows.length) {
      return NextResponse.json({ error: `Stock ${code} not found` }, { status: 404 })
    }

    return NextResponse.json({
      stockData: latestRows[0] ?? null,
      smartMoneyIndex: smRows[0] ?? null,
      historyData: histRows,
      brokerData: brokerRows,
      ownershipDetails: ownerRows,
      whaleMovement: whaleRows,
      foreignDivergence: foreignRows[0] ?? null,
      foreignFlowTrend: flowTrendRows,
      concentrationIndex: concRows[0] ?? null,
      institutionalChange: instChangeRows,
      stealthDivergence: stealthRows[0] ?? null,
      brokerConsistency: brokerConsRows,
      volumeSpikes: volSpikeRows,
      whaleActivity: whaleActRows[0] ?? null,
    })
  } catch (err: any) {
    const msg = err.message || String(err)
    console.error('[stock-detail]', { code, message: msg })
    return NextResponse.json({
      error: 'Gagal mengambil data. Silakan coba lagi.',
      detail: process.env.NODE_ENV === 'development' ? msg : undefined,
    }, { status: 500 })
  }
}
