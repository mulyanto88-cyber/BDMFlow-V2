export const dynamic = 'force-dynamic'

// src/app/api/radar/route.ts
// Watchlist Radar — multi-layer confluence scoring
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

function safeRun(q: string, p: any[] = []) {
  return run(q, p).catch((err: any) => {
    console.error('[radar] query failed:', err.message)
    throw new Error(err.message)
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action     = searchParams.get('action') || 'list'
  const sector     = searchParams.get('sector') || ''
  const group      = searchParams.get('group') || ''
  const signal     = searchParams.get('signal') || ''
  const minScore   = parseInt(searchParams.get('min_score') || '0')
  const minClose   = parseInt(searchParams.get('min_close') || '100')
  const minValue   = parseInt(searchParams.get('min_value') || '5000000000')
  const limit      = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  try {

    // ── 1. RADAR LIST ─────────────────────────────────────────────────────
    if (action === 'list') {
      const conditions: string[] = [
        `close >= ${minClose}`,
        `radar_score >= ${minScore}`,
        `warning_flag IS NULL`,
      ]
      if (sector) conditions.push(`sector = '${sector.replace(/'/g,"''")}'`)
      if (group)  conditions.push(`group_name = '${group.replace(/'/g,"''")}'`)
      if (signal) conditions.push(`composite_signal ILIKE '%${signal.replace(/'/g,"''").replace(/%/g,'')}%'`)

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

      const data = await safeRun(`
        SELECT
          stock_code,
          sector,
          group_name,
          close::DOUBLE                           AS close,
          ROUND(change_percent::DOUBLE, 2)        AS change_percent,
          radar_score::INTEGER                    AS radar_score,
          composite_signal,
          market_signal,
          ROUND(foreign_broker_net_7d::DOUBLE, 2) AS foreign_broker_net_7d,
          ROUND(local_inst_net_7d::DOUBLE, 2)     AS local_inst_net_7d,
          ROUND(retail_net_7d::DOUBLE, 2)         AS retail_net_7d,
          ROUND(prime_broker_net_7d::DOUBLE, 2)   AS prime_broker_net_7d,
          (foreign_net_7d::DOUBLE / 1e9)          AS foreign_net_7d_miliar,
          ROUND(ksei_net_smart_miliar::DOUBLE, 2) AS ksei_net_smart_miliar,
          insider_conviction_score::INTEGER       AS insider_conviction_score,
          insider_signal,
          whale_signal::BOOLEAN                   AS whale_signal,
          big_player_anomaly::BOOLEAN             AS big_player_anomaly,
          ROUND(aov_ratio_ma20::DOUBLE, 2)        AS aov_ratio_ma20,
          fresh_insider_buy::BOOLEAN              AS fresh_insider_buy,
          fresh_insider_sell::BOOLEAN             AS fresh_insider_sell,
          is_split_suspect::BOOLEAN               AS is_split_suspect
        FROM market.tb_radar
        ${where}
        ORDER BY radar_score DESC
        LIMIT ${limit}
      `)

      // Tambah daily value filter dari vw_stock_latest
      const filtered = minValue > 0
        ? await safeRun(`
            SELECT r.*, s.value::DOUBLE AS daily_value
            FROM (
              SELECT
                stock_code, sector, group_name,
                close::DOUBLE AS close,
                ROUND(change_percent::DOUBLE,2) AS change_percent,
                radar_score::INTEGER AS radar_score,
                composite_signal, market_signal,
                ROUND(foreign_broker_net_7d::DOUBLE,2) AS foreign_broker_net_7d,
                ROUND(local_inst_net_7d::DOUBLE,2)     AS local_inst_net_7d,
                ROUND(retail_net_7d::DOUBLE,2)         AS retail_net_7d,
                ROUND(prime_broker_net_7d::DOUBLE,2)   AS prime_broker_net_7d,
                (foreign_net_7d::DOUBLE / 1e9)         AS foreign_net_7d_miliar,
                ROUND(ksei_net_smart_miliar::DOUBLE,2) AS ksei_net_smart_miliar,
                insider_conviction_score::INTEGER      AS insider_conviction_score,
                insider_signal,
                whale_signal::BOOLEAN  AS whale_signal,
                big_player_anomaly::BOOLEAN AS big_player_anomaly,
                ROUND(aov_ratio_ma20::DOUBLE,2) AS aov_ratio_ma20,
                fresh_insider_buy::BOOLEAN  AS fresh_insider_buy,
                fresh_insider_sell::BOOLEAN AS fresh_insider_sell,
                is_split_suspect::BOOLEAN   AS is_split_suspect
              FROM market.tb_radar
              ${where}
              ORDER BY radar_score DESC
              LIMIT ${limit}
            ) r
            LEFT JOIN market.tb_stock_latest s ON r.stock_code = s.stock_code
            WHERE COALESCE(s.value, 0) >= ${minValue}
            ORDER BY r.radar_score DESC
          `)
        : data

      return NextResponse.json({ data: filtered })
    }

    // ── 2. SCORE DISTRIBUTION (untuk histogram) ───────────────────────────
    if (action === 'distribution') {
      const data = await safeRun(`
        SELECT
          FLOOR(radar_score / 10) * 10       AS score_band,
          COUNT(*)::BIGINT                   AS stock_count,
          COUNT(CASE WHEN composite_signal LIKE '%TRIPLE%' THEN 1 END)::BIGINT AS triple_confluence,
          COUNT(CASE WHEN whale_signal THEN 1 END)::BIGINT                     AS whale_count
        FROM market.tb_radar
        WHERE warning_flag IS NULL AND close >= 100
        GROUP BY FLOOR(radar_score / 10) * 10
        ORDER BY score_band DESC
      `)
      return NextResponse.json({ data })
    }

    // ── 3. SIGNAL BREAKDOWN ──────────────────────────────────────────────
    if (action === 'signals') {
      const data = await safeRun(`
        SELECT
          composite_signal,
          COUNT(*)::BIGINT                   AS count,
          ROUND(AVG(radar_score),1)          AS avg_score,
          ROUND(AVG(change_percent),2)       AS avg_chg,
          ROUND(AVG(ksei_net_smart_miliar),2) AS avg_ksei_smart
        FROM market.tb_radar
        WHERE warning_flag IS NULL AND close >= 100
        GROUP BY composite_signal
        ORDER BY avg_score DESC
      `)
      return NextResponse.json({ data })
    }

    // ── 4. BROKER CATEGORY BREAKDOWN (untuk saham tertentu) ──────────────
    if (action === 'broker_breakdown') {
      const code = (searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

      const [rolling, topBuyers, topSellers] = await Promise.all([
        safeRun(`
          SELECT
            ROUND(foreign_broker_net_1d::DOUBLE, 3)  AS fg_1d,
            ROUND(foreign_broker_net_7d::DOUBLE, 3)  AS fg_7d,
            ROUND(foreign_broker_net_30d::DOUBLE, 3) AS fg_30d,
            ROUND(prime_broker_net_7d::DOUBLE, 3)    AS prime_7d,
            ROUND(local_inst_net_1d::DOUBLE, 3)      AS inst_1d,
            ROUND(local_inst_net_7d::DOUBLE, 3)      AS inst_7d,
            ROUND(local_inst_net_30d::DOUBLE, 3)     AS inst_30d,
            ROUND(retail_net_1d::DOUBLE, 3)          AS retail_1d,
            ROUND(retail_net_7d::DOUBLE, 3)          AS retail_7d,
            foreign_brokers_buying_7d::BIGINT        AS fg_brokers_buying,
            local_inst_brokers_buying_7d::BIGINT     AS inst_brokers_buying
          FROM main.tb_broker_rolling_net
          WHERE stock_code = $1
        `, [code]),

        safeRun(`
          SELECT
            ba.broker_code,
            MAX(ba.broker_name)                     AS broker_name,
            COALESCE(bc.category, 'LOCAL_RETAIL')   AS category,
            COALESCE(bc.is_prime, false)::BOOLEAN   AS is_prime,
            ROUND(SUM(CASE WHEN ba.side='BUY' THEN ba.value ELSE 0 END) / 1e9, 3) AS buy_miliar,
            ROUND(SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END) / 1e9, 3) AS sell_miliar,
            ROUND(SUM(ba.value) / 1e9, 3)           AS net_miliar
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.stock_code = $1
            AND ba.date >= (SELECT MAX(date) FROM main.broker_activity) - INTERVAL '7 days'
          GROUP BY ba.broker_code, bc.category, bc.is_prime
          ORDER BY net_miliar DESC
          LIMIT 10
        `, [code]),

        safeRun(`
          SELECT
            ba.broker_code,
            MAX(ba.broker_name)                     AS broker_name,
            COALESCE(bc.category, 'LOCAL_RETAIL')   AS category,
            ROUND(SUM(ba.value) / 1e9, 3)           AS net_miliar
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.stock_code = $1
            AND ba.date >= (SELECT MAX(date) FROM main.broker_activity) - INTERVAL '7 days'
          GROUP BY ba.broker_code, bc.category
          ORDER BY net_miliar ASC
          LIMIT 5
        `, [code]),
      ])

      return NextResponse.json({
        rolling:    rolling[0] ?? null,
        topBuyers,
        topSellers,
      })
    }

    // ── 5. SECTOR RADAR SUMMARY ──────────────────────────────────────────
    if (action === 'sector_summary') {
      const data = await safeRun(`
        SELECT
          sector,
          COUNT(*)::BIGINT                          AS stock_count,
          ROUND(AVG(radar_score), 1)                AS avg_radar_score,
          COUNT(CASE WHEN radar_score >= 30 THEN 1 END)::BIGINT AS high_conviction,
          COUNT(CASE WHEN composite_signal LIKE '%TRIPLE%'
                       OR composite_signal LIKE '%PRIME%' THEN 1 END)::BIGINT AS strong_signals,
          ROUND(AVG(change_percent), 2)             AS avg_change,
          ROUND(SUM(ksei_net_smart_miliar), 2)      AS total_ksei_smart,
          ROUND(SUM(foreign_broker_net_7d), 2)      AS total_fg_broker_7d
        FROM market.tb_radar
        WHERE warning_flag IS NULL AND close >= 100
        GROUP BY sector
        ORDER BY avg_radar_score DESC
      `)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('[radar] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
