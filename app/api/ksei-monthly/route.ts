export const revalidate = 300

// src/app/api/ksei-monthly/route.ts
// KSEI Monthly Smart Money Tracker
// Data: ksei.monthly_snapshot (volume kepemilikan per tipe investor)
// Smart Money = CP + PF + IB + MF (corporate, pension, insurance/bank, mutual fund)
//
// CATATAN PENTING (data quality):
//  • Total_Shares di DB = 0 (pipeline bug, sedang difix) → JANGAN dipakai
//    → total dihitung manual dari sum 18 kolom investor (TOTAL_ALL)
//  • kolom _Chg_Val di DB semua = 0 → delta dihitung via LAG()
//  • Corporate action (rights/split) bikin delta meledak → di-guard:
//    kalau total ownership berubah >1.67× atau <0.6× MoM, delta di-null-kan
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

// ── Volume expressions (lembar saham) ──
const SMART         = `(Local_CP + Local_PF + Local_IB + Local_MF + Foreign_CP + Foreign_PF + Foreign_IB + Foreign_MF)::DOUBLE`
const LOCAL_SMART   = `(Local_CP + Local_PF + Local_IB + Local_MF)::DOUBLE`
const FOREIGN_SMART = `(Foreign_CP + Foreign_PF + Foreign_IB + Foreign_MF)::DOUBLE`
const RETAIL        = `(Local_ID + Foreign_ID)::DOUBLE`
// Total dihitung dari 18 kolom (Total_Shares DB = 0, tidak reliable)
const TOTAL_ALL = `(Local_IS+Local_CP+Local_PF+Local_IB+Local_ID+Local_MF+Local_SC+Local_FD+Local_OT
                   +Foreign_IS+Foreign_CP+Foreign_PF+Foreign_IB+Foreign_ID+Foreign_MF+Foreign_SC+Foreign_FD+Foreign_OT)::DOUBLE`
const FOREIGN_ALL = `(Foreign_IS+Foreign_CP+Foreign_PF+Foreign_IB+Foreign_ID+Foreign_MF+Foreign_SC+Foreign_FD+Foreign_OT)::DOUBLE`
const LOCAL_ALL   = `(Local_IS+Local_CP+Local_PF+Local_IB+Local_ID+Local_MF+Local_SC+Local_FD+Local_OT)::DOUBLE`

// Guard: rasio total ownership MoM dianggap normal kalau 0.6–1.67 (di luar itu = corp action)
const ratioOk = (cur: string, prev: string) =>
  `(${cur} / NULLIF(${prev},0) BETWEEN 0.6 AND 1.67)`

// 18 investor-type columns (Local/Foreign × 9 KSEI types) — whitelist for the flow actions.
// Any `type` param MUST be validated against this list before interpolation (anti-injection).
const TYPE_COLS = [
  'Local_IS','Local_CP','Local_PF','Local_IB','Local_ID','Local_MF','Local_SC','Local_FD','Local_OT',
  'Foreign_IS','Foreign_CP','Foreign_PF','Foreign_IB','Foreign_ID','Foreign_MF','Foreign_SC','Foreign_FD','Foreign_OT',
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || 'screener'
  const trend  = searchParams.get('trend') || ''
  const div    = searchParams.get('divergence') || ''
  const sector = searchParams.get('sector') || ''
  const code   = (searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

  try {
    // ════════════════════════════════════════════════════════════════════════
    // SCREENER — smart money momentum per saham
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'screener') {
      const conditions: string[] = ['ABS(COALESCE(m0_smart,0)) > 0.01']
      const params: any[] = []
      if (trend)  { params.push(trend);  conditions.push(`smart_money_trend = $${params.length}`) }
      if (div)    { params.push(div);    conditions.push(`divergence_signal = $${params.length}`) }
      if (sector) { params.push(sector); conditions.push(`sector = $${params.length}`) }

      const data = await run(`
        SELECT * FROM ksei.tb_ksei_monthly_scored
        WHERE ${conditions.join(' AND ')}
        ORDER BY ABS(COALESCE(m0_smart,0)) DESC
        LIMIT 300
      `, params)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // DEEP DIVE — full investor breakdown + 12-month trend for one stock
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'deepdive' && code) {
      // 1. Trend bulanan (smart/foreign/retail flow + all 18 investor flows) — using precalculated columns
      const trend12 = await run(`
        SELECT
          Date::VARCHAR AS month,
          Price::DOUBLE AS price,
          ROUND((Local_CP_Chg_Val + Local_PF_Chg_Val + Local_IB_Chg_Val + Local_MF_Chg_Val +
                 Foreign_CP_Chg_Val + Foreign_PF_Chg_Val + Foreign_IB_Chg_Val + Foreign_MF_Chg_Val) / 1e9, 2) AS smart_flow,
          ROUND((Local_CP_Chg_Val + Local_PF_Chg_Val + Local_IB_Chg_Val + Local_MF_Chg_Val) / 1e9, 2) AS local_flow,
          ROUND((Foreign_CP_Chg_Val + Foreign_PF_Chg_Val + Foreign_IB_Chg_Val + Foreign_MF_Chg_Val) / 1e9, 2) AS foreign_flow,
          ROUND((Local_ID_Chg_Val + Foreign_ID_Chg_Val) / 1e9, 2) AS retail_flow,
          ROUND(Total_Foreign / NULLIF(Total_Shares, 0) * 100, 2) AS foreign_own_pct,
          -- Individual 18 flows
          ROUND(Local_IS_Chg_Val / 1e9, 2) AS local_is_flow,
          ROUND(Local_CP_Chg_Val / 1e9, 2) AS local_cp_flow,
          ROUND(Local_PF_Chg_Val / 1e9, 2) AS local_pf_flow,
          ROUND(Local_IB_Chg_Val / 1e9, 2) AS local_ib_flow,
          ROUND(Local_ID_Chg_Val / 1e9, 2) AS local_id_flow,
          ROUND(Local_MF_Chg_Val / 1e9, 2) AS local_mf_flow,
          ROUND(Local_SC_Chg_Val / 1e9, 2) AS local_sc_flow,
          ROUND(Local_FD_Chg_Val / 1e9, 2) AS local_fd_flow,
          ROUND(Local_OT_Chg_Val / 1e9, 2) AS local_ot_flow,
          ROUND(Foreign_IS_Chg_Val / 1e9, 2) AS foreign_is_flow,
          ROUND(Foreign_CP_Chg_Val / 1e9, 2) AS foreign_cp_flow,
          ROUND(Foreign_PF_Chg_Val / 1e9, 2) AS foreign_pf_flow,
          ROUND(Foreign_IB_Chg_Val / 1e9, 2) AS foreign_ib_flow,
          ROUND(Foreign_ID_Chg_Val / 1e9, 2) AS foreign_id_flow,
          ROUND(Foreign_MF_Chg_Val / 1e9, 2) AS foreign_mf_flow,
          ROUND(Foreign_SC_Chg_Val / 1e9, 2) AS foreign_sc_flow,
          ROUND(Foreign_FD_Chg_Val / 1e9, 2) AS foreign_fd_flow,
          ROUND(Foreign_OT_Chg_Val / 1e9, 2) AS foreign_ot_flow
        FROM ksei.monthly_snapshot
        WHERE Code = $1
          AND Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot WHERE Code = $1) - INTERVAL '12 months'
        ORDER BY Date ASC
      `, [code])

      // 2. Komposisi 18 tipe investor (latest month) — % of Total_Shares via unpivot
      const composition = await run(`
        WITH latest AS (
          SELECT * FROM ksei.monthly_snapshot WHERE Code = $1
          ORDER BY Date DESC LIMIT 1
        )
        SELECT
          t.tipe, t.kategori,
          ROUND(t.shares / NULLIF(latest.Total_Shares, 0) * 100, 2) AS pct,
          t.shares,
          ROUND(t.delta_shares / NULLIF(latest.Total_Shares, 0) * 100, 3) AS delta_pct,
          t.delta_shares
        FROM latest,
        (
          SELECT 'Local CP' AS tipe, 'Smart' AS kategori, Local_CP AS shares, Local_CP_Chg_Vol AS delta_shares FROM latest
          UNION ALL SELECT 'Local PF','Smart',Local_PF,Local_PF_Chg_Vol
          UNION ALL SELECT 'Local IB','Smart',Local_IB,Local_IB_Chg_Vol
          UNION ALL SELECT 'Local MF','Smart',Local_MF,Local_MF_Chg_Vol
          UNION ALL SELECT 'Local ID','Retail',Local_ID,Local_ID_Chg_Vol
          UNION ALL SELECT 'Local IS','Inst',Local_IS,Local_IS_Chg_Vol
          UNION ALL SELECT 'Local SC','Other',Local_SC,Local_SC_Chg_Vol
          UNION ALL SELECT 'Local FD','Other',Local_FD,Local_FD_Chg_Vol
          UNION ALL SELECT 'Local OT','Other',Local_OT,Local_OT_Chg_Vol
          UNION ALL SELECT 'Foreign CP','Smart',Foreign_CP,Foreign_CP_Chg_Vol
          UNION ALL SELECT 'Foreign PF','Smart',Foreign_PF,Foreign_PF_Chg_Vol
          UNION ALL SELECT 'Foreign IB','Smart',Foreign_IB,Foreign_IB_Chg_Vol
          UNION ALL SELECT 'Foreign MF','Smart',Foreign_MF,Foreign_MF_Chg_Vol
          UNION ALL SELECT 'Foreign ID','Retail',Foreign_ID,Foreign_ID_Chg_Vol
          UNION ALL SELECT 'Foreign IS','Inst',Foreign_IS,Foreign_IS_Chg_Vol
          UNION ALL SELECT 'Foreign SC','Other',Foreign_SC,Foreign_SC_Chg_Vol
          UNION ALL SELECT 'Foreign FD','Other',Foreign_FD,Foreign_FD_Chg_Vol
          UNION ALL SELECT 'Foreign OT','Other',Foreign_OT,Foreign_OT_Chg_Vol
        ) t
        WHERE t.shares > 0
        ORDER BY pct DESC
      `, [code])

      // 3. Summary stats — using pre-calculated total_shares
      const summary = await run(`
        SELECT
          Code AS stock_code, Date::VARCHAR AS latest_month, Price::DOUBLE AS price,
          Total_Shares AS total_shares,
          ROUND(Total_Foreign / NULLIF(Total_Shares, 0) * 100, 2) AS foreign_pct,
          ROUND(Total_Local / NULLIF(Total_Shares, 0) * 100, 2) AS local_pct,
          Top_Buyer AS top_buyer, Top_Seller AS top_seller,
          Is_Split_Suspect AS is_split, Is_Reverse_Suspect AS is_reverse
        FROM ksei.monthly_snapshot
        WHERE Code = $1
        ORDER BY Date DESC LIMIT 1
      `, [code])

      // 4. Funds and ETFs holding this stock (latest month vs prev month) from 1% registry
      const funds = await run(`
        WITH latest_date AS (
          SELECT MAX(date) AS mdate FROM ksei.ownership_1pct WHERE share_code = $1
        ),
        prev_date AS (
          SELECT MAX(date) AS pdate FROM ksei.ownership_1pct 
          WHERE share_code = $1 AND date < (SELECT mdate FROM latest_date)
        ),
        cur AS (
          SELECT * FROM ksei.ownership_1pct, latest_date WHERE date = latest_date.mdate AND share_code = $1
        ),
        prev AS (
          SELECT * FROM ksei.ownership_1pct, prev_date WHERE date = prev_date.pdate AND share_code = $1
        )
        SELECT
          cur.investor_name,
          cur.percentage AS cur_pct,
          cur.total_holding_shares AS cur_shares,
          COALESCE(prev.percentage, 0) AS prev_pct,
          (cur.percentage - COALESCE(prev.percentage, 0)) AS chg_pct,
          (cur.total_holding_shares - COALESCE(prev.total_holding_shares, 0))::BIGINT AS chg_shares,
          CASE
            WHEN cur.local_foreign IN ('L', 'D') THEN 'Local'
            WHEN cur.local_foreign = 'F' THEN 'Foreign'
            ELSE 'Unknown'
          END AS side,
          CASE
            WHEN cur.investor_name ILIKE '%ETF%' 
              OR cur.investor_name ILIKE '%EXCHANGE TRADED%' 
              OR cur.investor_type = 'Exchange Traded Funds' 
              THEN 'ETF'
            ELSE 'Mutual Fund'
          END AS category
        FROM cur
        LEFT JOIN prev ON cur.investor_name = prev.investor_name
        WHERE cur.investor_name ILIKE '%ETF%'
           OR cur.investor_name ILIKE '%EXCHANGE TRADED%'
           OR cur.investor_name ILIKE '%REKSA DANA%'
           OR cur.investor_name ILIKE '%MUTUAL FUND%'
           OR cur.investor_type IN ('Mutual Funds', 'MF', 'Exchange Traded Funds')
        ORDER BY cur_pct DESC
      `, [code])

      return NextResponse.json({
        trend: trend12,
        composition,
        summary: (summary as any[])[0] ?? null,
        funds,
      })
    }

    // ════════════════════════════════════════════════════════════════════════
    // SECTORS — list for filter dropdown
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'sectors') {
      const data = await run(`
        SELECT DISTINCT sector FROM market.company_profile
        WHERE sector IS NOT NULL AND sector != 'Others'
        ORDER BY sector
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // STOCK TREND — per-stock 12-month smart-money trend (for the stock-detail
    // "KSEI Intel" tab) using precalculated columns.
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'stock_trend' && code) {
      const data = await run(`
        SELECT Date::VARCHAR AS month, Price::DOUBLE AS price,
          ROUND((Local_CP_Chg_Val + Local_PF_Chg_Val + Local_IB_Chg_Val + Foreign_CP_Chg_Val + Foreign_PF_Chg_Val + Foreign_IB_Chg_Val) / 1e9, 2) AS net_smart,
          ROUND(Local_CP_Chg_Val / 1e9, 2) AS cp_flow,
          ROUND(Local_PF_Chg_Val / 1e9, 2) AS pf_flow,
          ROUND(Local_IB_Chg_Val / 1e9, 2) AS ib_flow,
          ROUND(Local_ID_Chg_Val / 1e9, 2) AS retail,
          ROUND((Foreign_CP_Chg_Val + Foreign_PF_Chg_Val + Foreign_IB_Chg_Val) / 1e9, 2) AS foreign_smart
        FROM ksei.monthly_snapshot
        WHERE Code = $1
          AND Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot WHERE Code = $1) - INTERVAL '12 months'
        ORDER BY Date ASC
      `, [code])
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // FLOWS — global net flow per investor type (market-wide, MoM), last N months
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'flows') {
      const months  = Math.min(12, Math.max(2, parseInt(searchParams.get('months') || '6')))
      const sumCols = TYPE_COLS.map(c =>
        `ROUND(SUM(COALESCE("${c}_Chg_Val", 0)) / 1e9, 1) AS "${c}"`
      ).join(',\n            ')
      const data = await run(`
        SELECT Date::VARCHAR AS month,
            ${sumCols}
        FROM ksei.monthly_snapshot
        WHERE Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot) - INTERVAL '${months} months'
        GROUP BY Date ORDER BY Date ASC
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // FLOW DETAIL — top stocks a given investor type bought / sold in one month
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'flow_detail') {
      const type = searchParams.get('type') || ''
      if (!TYPE_COLS.includes(type)) {
        return NextResponse.json({ error: 'invalid type' }, { status: 400 })
      }
      const month     = searchParams.get('month') || ''
      const monthOk   = /^\d{4}-\d{2}-\d{2}$/.test(month)
      const monthExpr = monthOk ? '$1::DATE' : '(SELECT MAX(Date) FROM ksei.monthly_snapshot)'
      const params    = monthOk ? [month] : []
      const detailSql = (dir: 'buy' | 'sell') => `
        SELECT l.Code AS stock_code, s.sector,
          ROUND(COALESCE(l."${type}_Chg_Val", 0) / 1e9, 2) AS flow_m,
          COALESCE(l."${type}_Chg_Vol", 0) AS delta_shares,
          l.Price::DOUBLE AS price
        FROM ksei.monthly_snapshot l
        LEFT JOIN ksei.tb_ksei_monthly_scored s ON s.stock_code = l.Code
        WHERE l.Date = ${monthExpr}
          AND COALESCE(l."${type}_Chg_Vol", 0) ${dir === 'buy' ? '> 0' : '< 0'}
        ORDER BY flow_m ${dir === 'buy' ? 'DESC' : 'ASC'}
        LIMIT 25
      `
      const [buys, sells] = await Promise.all([run(detailSql('buy'), params), run(detailSql('sell'), params)])
      return NextResponse.json({ buys, sells, type, month: monthOk ? month : null })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
