// src/app/api/broker-flow/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'
import { intParam, snapParam } from '@/lib/utils'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  const guarded = await guardApi(req, { pro: true })
  if (guarded) return guarded

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'by_stock'
  // Snap to the UI's own options so cache keys converge (days=6 → 5, days=9 → 7).
  const days   = snapParam(intParam(searchParams.get('days'), 7, 1, 90), [1, 5, 7, 14, 30], 7)
  const cat    = searchParams.get('category') || ''
  const sector = searchParams.get('sector') || ''

  try {
    // ── Per Stock ───────────────────────────────────────────────────────────
    if (action === 'by_stock') {
      // User-supplied strings are sent as bind parameters ($1, $2, ...) — never
      // interpolated into the SQL text. Note the two filters apply in different
      // scopes: `category` filters the broker CTE, `sector` filters the joined
      // stock row (tb_stock_latest.sector — the old code referenced a `cp`
      // alias that doesn't exist in this query, so sector filtering was broken).
      const flowConditions: string[] = []
      const outerConditions: string[] = []
      const params: any[] = []
      if (cat) {
        params.push(cat)
        flowConditions.push(`AND COALESCE(bc.category,'LOCAL_RETAIL') = $${params.length}`)
      }
      if (sector) {
        params.push(sector)
        outerConditions.push(`AND s.sector = $${params.length}`)
      }
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity),
        flow AS (
          SELECT ba.stock_code,
            ROUND((SUM(CASE WHEN bc.category='FOREIGN'      THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3) AS fg_net,
            ROUND((SUM(CASE WHEN bc.category='LOCAL_INST'   THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3) AS inst_net,
            ROUND((SUM(CASE WHEN bc.category='LOCAL_RETAIL' OR bc.category IS NULL
                           THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3) AS retail_net,
            ROUND((SUM(CASE WHEN bc.is_prime THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3)                AS prime_net,
            ROUND((SUM(ba.value)/1e9)::NUMERIC,3)                                                      AS total_net,
            COUNT(DISTINCT CASE WHEN bc.category='FOREIGN' AND ba.value>0 THEN ba.broker_code END) AS fg_buyers,
            COUNT(DISTINCT ba.broker_code) AS broker_count
          FROM main.broker_activity ba
          LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
          WHERE ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
          ${flowConditions.join('\n')}
          GROUP BY ba.stock_code
        )
        SELECT
          f.stock_code, f.fg_net, f.inst_net, f.retail_net, f.prime_net, f.total_net,
          f.fg_buyers, f.broker_count,
          s.close::FLOAT8 AS close, ROUND(s.change_percent::FLOAT8,2) AS change_percent,
          s.sector, s.group_name, s.signal, s.whale_signal::BOOLEAN AS whale_signal
        FROM flow f
        LEFT JOIN market.tb_stock_latest s ON f.stock_code = s.stock_code
        WHERE (ABS(f.fg_net) > 0.1 OR ABS(f.inst_net) > 0.1)
        ${outerConditions.join('\n')}
        ORDER BY f.fg_net DESC NULLS LAST
        LIMIT 200
      `, params)
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
          ROUND((SUM(ba.value)/1e9)::NUMERIC,3)             AS net_miliar,
          ROUND((SUM(CASE WHEN ba.side='BUY'  THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3) AS buy_miliar,
          ROUND((SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END)/1e9)::NUMERIC,3) AS sell_miliar,
          COUNT(DISTINCT ba.stock_code)::BIGINT  AS stocks_traded,
          COUNT(DISTINCT ba.date)::BIGINT        AS active_days
        FROM main.broker_activity ba
        LEFT JOIN main.broker_classification bc ON ba.broker_code = bc.broker_code
        WHERE ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
        GROUP BY ba.broker_code, bc.category, bc.origin, bc.is_prime
        ORDER BY ABS(SUM(ba.value)) DESC NULLS LAST
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
               ROUND((net_val/1e9)::NUMERIC,3) AS net_miliar
        FROM daily_cat
        ORDER BY dt DESC NULLS LAST, category
      `)
      return NextResponse.json({ data })
    }

    // ── Broker Favorites (top stocks per broker) ────────────────────────────
    if (action === 'broker_favorites') {
      const code = (searchParams.get('broker_code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
      if (!code) return NextResponse.json({ error: 'broker_code required' }, { status: 400 })
      const data = await run(`
        WITH max_dt AS (SELECT MAX(date) AS d FROM main.broker_activity)
        SELECT ba.stock_code,
               ROUND((SUM(ba.value)/1e9)::NUMERIC,3) AS net_miliar,
               ROUND((SUM(CASE WHEN ba.side='BUY' THEN ba.value ELSE 0 END)/1e9)::NUMERIC,3) AS buy_miliar,
               ROUND((SUM(CASE WHEN ba.side='SELL' THEN ABS(ba.value) ELSE 0 END)/1e9)::NUMERIC,3) AS sell_miliar,
               s.close::FLOAT8 AS close, ROUND(s.change_percent::FLOAT8,2) AS change_percent, s.sector
        FROM main.broker_activity ba
        LEFT JOIN market.tb_stock_latest s ON ba.stock_code = s.stock_code
        WHERE ba.broker_code = $1
          AND ba.date >= (SELECT d FROM max_dt) - INTERVAL '${days} days'
        GROUP BY ba.stock_code, s.close, s.change_percent, s.sector
        ORDER BY ABS(SUM(ba.value)) DESC NULLS LAST
        LIMIT 20
      `, [code])
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    // Generic message — DB internals stay server-side.
    console.error('[broker-flow]', { action, message: err?.message })
    return NextResponse.json({ error: 'Gagal mengambil data. Silakan coba lagi.' }, { status: 500 })
  }
}
