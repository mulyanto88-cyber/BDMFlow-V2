// src/app/api/broker-flow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

export const revalidate = 1800

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'by_stock'
  const days   = Math.min(parseInt(searchParams.get('days') || '7'), 90)
  const cat    = searchParams.get('category') || ''
  const sector = searchParams.get('sector') || ''

  try {
    // ── Per Stock ───────────────────────────────────────────────────────────
    if (action === 'by_stock') {
      const catFilter    = cat    ? `AND COALESCE(bc.category,'LOCAL_RETAIL') = '${cat}'`    : ''
      const sectorFilter = sector ? `AND cp.sector = '${sector.replace(/'/g,"''")}'` : ''
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity),
        flow AS (
          SELECT ba.stock_code,
            ROUND(SUM(CASE WHEN bc.category='FOREIGN'      THEN ba.value ELSE 0 END)/1e9,3) AS fg_net,
            ROUND(SUM(CASE WHEN bc.category='LOCAL_INST'   THEN ba.value ELSE 0 END)/1e9,3) AS inst_net,
            ROUND(SUM(CASE WHEN bc.category='LOCAL_RETAIL' OR bc.category IS NULL
                           THEN ba.value ELSE 0 END)/1e9,3)                                 AS retail_net,
            ROUND(SUM(CASE WHEN bc.is_prime THEN ba.value ELSE 0 END)/1e9,3)                AS prime_net,
            ROUND(SUM(ba.value)/1e9,3)                                                      AS total_net,
            COUNT(DISTINCT CASE WHEN bc.category='FOREIGN' AND ba.value>0 THEN ba.broker_code END) AS fg_buyers,
            COUNT(DISTINCT ba.broker_code) AS broker_count
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
          ${catFilter}
          GROUP BY ba.stock_code
        )
        SELECT
          f.stock_code, f.fg_net, f.inst_net, f.retail_net, f.prime_net, f.total_net,
          f.fg_buyers, f.broker_count,
          s.close::DOUBLE AS close, ROUND(s.change_percent::DOUBLE,2) AS change_percent,
          s.sector, s.group_name, s.signal, s.whale_signal::BOOLEAN
        FROM flow f
        LEFT JOIN market.tb_stock_latest s ON f.stock_code = s.stock_code
        WHERE (ABS(f.fg_net) > 0.1 OR ABS(f.inst_net) > 0.1)
        ${sectorFilter}
        ORDER BY f.fg_net DESC
        LIMIT 200
      `)
      return NextResponse.json({ data })
    }

    // ── Per Broker ──────────────────────────────────────────────────────────
    if (action === 'by_broker') {
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity)
        SELECT
          ba.broker_code, MAX(ba.broker_name) AS broker_name,
          COALESCE(bc.category,'LOCAL_RETAIL')  AS category,
          COALESCE(bc.origin,'Indonesia')        AS origin,
          COALESCE(bc.is_prime,false)::BOOLEAN   AS is_prime,
          ROUND(SUM(ba.value)/1e9,3)             AS net_miliar,
          ROUND(SUM(CASE WHEN ba.side='BUY'  THEN ba.value ELSE 0 END)/1e9,3) AS buy_miliar,
          ROUND(SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END)/1e9,3) AS sell_miliar,
          COUNT(DISTINCT ba.stock_code)::BIGINT  AS stocks_traded,
          COUNT(DISTINCT ba.date)::BIGINT        AS active_days
        FROM main.broker_activity ba
        LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
        WHERE ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
        GROUP BY ba.broker_code, bc.category, bc.origin, bc.is_prime
        ORDER BY ABS(SUM(ba.value)) DESC
        LIMIT 50
      `)
      return NextResponse.json({ data })
    }

    // ── Category Aggregate ──────────────────────────────────────────────────
    if (action === 'by_category') {
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity),
        daily_cat AS (
          SELECT CAST(ba.date AS DATE) AS dt,
                 COALESCE(bc.category,'LOCAL_RETAIL') AS category,
                 SUM(ba.value) AS net_val
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.date >= (SELECT d FROM max_dt) - INTERVAL '30 days'
          GROUP BY CAST(ba.date AS DATE), COALESCE(bc.category,'LOCAL_RETAIL')
        )
        SELECT dt::VARCHAR AS date, category,
               ROUND(net_val/1e9,3) AS net_miliar
        FROM daily_cat
        ORDER BY dt DESC, category
      `)
      return NextResponse.json({ data })
    }

    // ── Broker Favorites (top stocks per broker) ────────────────────────────
    if (action === 'broker_favorites') {
      const code = (searchParams.get('broker_code') || '').toUpperCase()
      if (!code) return NextResponse.json({ error: 'broker_code required' }, { status: 400 })
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity)
        SELECT ba.stock_code,
               ROUND(SUM(ba.value)/1e9,3) AS net_miliar,
               ROUND(SUM(CASE WHEN ba.side='BUY' THEN ba.value ELSE 0 END)/1e9,3) AS buy_miliar,
               ROUND(SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END)/1e9,3) AS sell_miliar,
               s.close::DOUBLE AS close, ROUND(s.change_percent::DOUBLE,2) AS change_percent, s.sector
        FROM main.broker_activity ba
        LEFT JOIN market.tb_stock_latest s ON ba.stock_code = s.stock_code
        WHERE ba.broker_code = '${code.replace(/'/g,"''")}'
          AND ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
        GROUP BY ba.stock_code, s.close, s.change_percent, s.sector
        ORDER BY ABS(SUM(ba.value)) DESC
        LIMIT 20
      `)
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
