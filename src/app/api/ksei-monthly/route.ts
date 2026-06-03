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
      const trendFilter  = trend  ? `AND smart_money_trend = '${trend}'` : ''
      const divFilter    = div    ? `AND divergence_signal = '${div}'` : ''
      const sectorFilter = sector ? `AND cp.sector = '${sector.replace(/'/g, "''")}'` : ''

      const data = await run(`
        WITH base AS (
          SELECT
            Code, Date, Price::DOUBLE AS price,
            ${SMART}         AS smart_vol,
            ${LOCAL_SMART}   AS local_smart_vol,
            ${FOREIGN_SMART} AS foreign_smart_vol,
            ${RETAIL}        AS retail_vol,
            ${TOTAL_ALL}     AS total_all,
            ${FOREIGN_ALL}   AS foreign_all,
            ${LOCAL_ALL}     AS local_all,
            Top_Buyer, Top_Seller,
            ROW_NUMBER() OVER (PARTITION BY Code ORDER BY Date DESC) AS rn,
            LAG(${SMART})         OVER (PARTITION BY Code ORDER BY Date) AS p1_smart,
            LAG(${SMART}, 2)      OVER (PARTITION BY Code ORDER BY Date) AS p2_smart,
            LAG(${SMART}, 3)      OVER (PARTITION BY Code ORDER BY Date) AS p3_smart,
            LAG(${LOCAL_SMART})   OVER (PARTITION BY Code ORDER BY Date) AS p1_local,
            LAG(${FOREIGN_SMART}) OVER (PARTITION BY Code ORDER BY Date) AS p1_foreign,
            LAG(${RETAIL})        OVER (PARTITION BY Code ORDER BY Date) AS p1_retail,
            LAG(${TOTAL_ALL})     OVER (PARTITION BY Code ORDER BY Date) AS p1_total,
            LAG(${TOTAL_ALL}, 2)  OVER (PARTITION BY Code ORDER BY Date) AS p2_total,
            LAG(${TOTAL_ALL}, 3)  OVER (PARTITION BY Code ORDER BY Date) AS p3_total
          FROM ksei.monthly_snapshot
        ),
        calc AS (
          SELECT
            Code AS stock_code, price, Top_Buyer, Top_Seller, total_all, p1_total,
            -- Δ smart money (miliar Rp), di-guard corp action per bulan
            CASE WHEN ${ratioOk('total_all','p1_total')}
                 THEN ROUND((smart_vol - p1_smart) * price / 1e9, 2) END AS m0_smart,
            CASE WHEN ${ratioOk('p1_total','p2_total')}
                 THEN ROUND((p1_smart - p2_smart) * price / 1e9, 2) END AS m1_smart,
            CASE WHEN ${ratioOk('p2_total','p3_total')}
                 THEN ROUND((p2_smart - p3_smart) * price / 1e9, 2) END AS m2_smart,
            CASE WHEN ${ratioOk('total_all','p1_total')}
                 THEN ROUND((local_smart_vol   - p1_local)   * price / 1e9, 2) END AS m0_local,
            CASE WHEN ${ratioOk('total_all','p1_total')}
                 THEN ROUND((foreign_smart_vol - p1_foreign) * price / 1e9, 2) END AS m0_foreign,
            CASE WHEN ${ratioOk('total_all','p1_total')}
                 THEN ROUND((retail_vol - p1_retail) * price / 1e9, 2) END AS m0_retail,
            -- % ownership (corp-action immune, dari sum 18 kolom)
            ROUND(foreign_all / NULLIF(total_all,0) * 100, 2) AS foreign_own_pct,
            ROUND(local_all   / NULLIF(total_all,0) * 100, 2) AS local_own_pct,
            -- Δ smart % ownership poin (corp-action immune)
            ROUND(smart_vol / NULLIF(total_all,0) * 100
                - p1_smart  / NULLIF(p1_total,0)  * 100, 3) AS smart_pct_delta
          FROM base WHERE rn = 1 AND p1_smart IS NOT NULL
        ),
        scored AS (
          SELECT *,
            ROUND(COALESCE(m0_smart,0)+COALESCE(m1_smart,0)+COALESCE(m2_smart,0), 2) AS cum3m_smart,
            CASE
              WHEN COALESCE(m0_smart,0) > 0 AND COALESCE(m1_smart,0) > 0 AND COALESCE(m2_smart,0) > 0 THEN 'KONSISTEN_AKUMULASI'
              WHEN COALESCE(m0_smart,0) > 0 THEN 'MULAI_AKUMULASI'
              WHEN COALESCE(m0_smart,0) < 0 AND COALESCE(m1_smart,0) < 0 AND COALESCE(m2_smart,0) < 0 THEN 'KONSISTEN_DISTRIBUSI'
              WHEN COALESCE(m0_smart,0) < 0 THEN 'MULAI_DISTRIBUSI'
              ELSE 'MIXED'
            END AS smart_money_trend,
            CASE
              WHEN COALESCE(m0_smart,0) > 0 AND COALESCE(m0_retail,0) < 0 THEN 'DIVERGEN_BULLISH'
              WHEN COALESCE(m0_smart,0) < 0 AND COALESCE(m0_retail,0) > 0 THEN 'DIVERGEN_BEARISH'
              ELSE 'ALIGNED'
            END AS divergence_signal,
            (CASE WHEN COALESCE(m0_smart,0) > 0 THEN 1 ELSE 0 END
            +CASE WHEN COALESCE(m1_smart,0) > 0 THEN 1 ELSE 0 END
            +CASE WHEN COALESCE(m2_smart,0) > 0 THEN 1 ELSE 0 END) AS months_positive
          FROM calc
        )
        SELECT
          s.stock_code, cp.sector, cp.group_name,
          s.price AS latest_price,
          s.m0_smart, s.m1_smart, s.m2_smart, s.cum3m_smart,
          s.m0_local, s.m0_foreign, s.m0_retail,
          s.foreign_own_pct, s.local_own_pct, s.smart_pct_delta,
          s.months_positive, s.Top_Buyer AS top_buyer, s.Top_Seller AS top_seller,
          s.smart_money_trend, s.divergence_signal,
          l.close::DOUBLE AS market_price, l.change_percent::DOUBLE AS change_pct
        FROM scored s
        LEFT JOIN market.company_profile cp ON s.stock_code = cp.stock_code
        LEFT JOIN market.vw_stock_latest  l ON s.stock_code = l.stock_code
        WHERE ABS(COALESCE(s.m0_smart,0)) > 0.01
          ${trendFilter} ${divFilter} ${sectorFilter}
        ORDER BY ABS(COALESCE(s.m0_smart,0)) DESC
        LIMIT 300
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // DEEP DIVE — full investor breakdown + 12-month trend for one stock
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'deepdive' && code) {
      // 1. Trend bulanan (smart/foreign/retail flow) — guarded corp action
      const trend12 = await run(`
        WITH lag_data AS (
          SELECT
            Date, Price::DOUBLE AS price,
            ${SMART} AS smart_vol, ${LOCAL_SMART} AS local_smart, ${FOREIGN_SMART} AS foreign_smart,
            ${RETAIL} AS retail_vol, ${TOTAL_ALL} AS total_all, ${FOREIGN_ALL} AS foreign_all,
            LAG(${SMART})         OVER (ORDER BY Date) AS p_smart,
            LAG(${LOCAL_SMART})   OVER (ORDER BY Date) AS p_local,
            LAG(${FOREIGN_SMART}) OVER (ORDER BY Date) AS p_foreign,
            LAG(${RETAIL})        OVER (ORDER BY Date) AS p_retail,
            LAG(${TOTAL_ALL})     OVER (ORDER BY Date) AS p_total
          FROM ksei.monthly_snapshot WHERE Code = '${code}'
        )
        SELECT
          Date::VARCHAR AS month, price,
          CASE WHEN ${ratioOk('total_all','p_total')}
               THEN ROUND((smart_vol   - p_smart)   * price / 1e9, 2) ELSE 0 END AS smart_flow,
          CASE WHEN ${ratioOk('total_all','p_total')}
               THEN ROUND((local_smart - p_local)   * price / 1e9, 2) ELSE 0 END AS local_flow,
          CASE WHEN ${ratioOk('total_all','p_total')}
               THEN ROUND((foreign_smart - p_foreign) * price / 1e9, 2) ELSE 0 END AS foreign_flow,
          CASE WHEN ${ratioOk('total_all','p_total')}
               THEN ROUND((retail_vol  - p_retail)  * price / 1e9, 2) ELSE 0 END AS retail_flow,
          ROUND(foreign_all / NULLIF(total_all,0) * 100, 2) AS foreign_own_pct
        FROM lag_data
        WHERE p_smart IS NOT NULL
          AND Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot WHERE Code='${code}') - INTERVAL '12 months'
        ORDER BY Date ASC
      `)

      // 2. Komposisi 18 tipe investor (latest vs prev month) — % of TOTAL_ALL
      const composition = await run(`
        WITH latest2 AS (
          SELECT * FROM ksei.monthly_snapshot WHERE Code = '${code}'
          ORDER BY Date DESC LIMIT 2
        ),
        cur  AS (SELECT * FROM latest2 ORDER BY Date DESC LIMIT 1),
        prev AS (SELECT * FROM latest2 ORDER BY Date ASC LIMIT 1),
        tot AS (SELECT ${TOTAL_ALL} AS total_all FROM cur)
        SELECT
          t.tipe, t.kategori,
          ROUND(t.cur_vol / NULLIF((SELECT total_all FROM tot),0) * 100, 2) AS pct,
          t.cur_vol::BIGINT  AS shares,
          ROUND((t.cur_vol - t.prev_vol) / NULLIF((SELECT total_all FROM tot),0) * 100, 3) AS delta_pct,
          (t.cur_vol - t.prev_vol)::BIGINT AS delta_shares
        FROM (
          SELECT 'Local CP' AS tipe, 'Smart' AS kategori, (SELECT Local_CP FROM cur) AS cur_vol, (SELECT Local_CP FROM prev) AS prev_vol
          UNION ALL SELECT 'Local PF','Smart',(SELECT Local_PF FROM cur),(SELECT Local_PF FROM prev)
          UNION ALL SELECT 'Local IB','Smart',(SELECT Local_IB FROM cur),(SELECT Local_IB FROM prev)
          UNION ALL SELECT 'Local MF','Smart',(SELECT Local_MF FROM cur),(SELECT Local_MF FROM prev)
          UNION ALL SELECT 'Local ID','Retail',(SELECT Local_ID FROM cur),(SELECT Local_ID FROM prev)
          UNION ALL SELECT 'Local IS','Inst',(SELECT Local_IS FROM cur),(SELECT Local_IS FROM prev)
          UNION ALL SELECT 'Local SC','Other',(SELECT Local_SC FROM cur),(SELECT Local_SC FROM prev)
          UNION ALL SELECT 'Local FD','Other',(SELECT Local_FD FROM cur),(SELECT Local_FD FROM prev)
          UNION ALL SELECT 'Local OT','Other',(SELECT Local_OT FROM cur),(SELECT Local_OT FROM prev)
          UNION ALL SELECT 'Foreign CP','Smart',(SELECT Foreign_CP FROM cur),(SELECT Foreign_CP FROM prev)
          UNION ALL SELECT 'Foreign PF','Smart',(SELECT Foreign_PF FROM cur),(SELECT Foreign_PF FROM prev)
          UNION ALL SELECT 'Foreign IB','Smart',(SELECT Foreign_IB FROM cur),(SELECT Foreign_IB FROM prev)
          UNION ALL SELECT 'Foreign MF','Smart',(SELECT Foreign_MF FROM cur),(SELECT Foreign_MF FROM prev)
          UNION ALL SELECT 'Foreign ID','Retail',(SELECT Foreign_ID FROM cur),(SELECT Foreign_ID FROM prev)
          UNION ALL SELECT 'Foreign IS','Inst',(SELECT Foreign_IS FROM cur),(SELECT Foreign_IS FROM prev)
          UNION ALL SELECT 'Foreign SC','Other',(SELECT Foreign_SC FROM cur),(SELECT Foreign_SC FROM prev)
          UNION ALL SELECT 'Foreign FD','Other',(SELECT Foreign_FD FROM cur),(SELECT Foreign_FD FROM prev)
          UNION ALL SELECT 'Foreign OT','Other',(SELECT Foreign_OT FROM cur),(SELECT Foreign_OT FROM prev)
        ) t
        WHERE t.cur_vol > 0
        ORDER BY pct DESC
      `)

      // 3. Summary stats — foreign% dari sum 18 kolom
      const summary = await run(`
        SELECT
          Code AS stock_code, Date::VARCHAR AS latest_month, Price::DOUBLE AS price,
          ${TOTAL_ALL} AS total_shares,
          ROUND(${FOREIGN_ALL} / NULLIF(${TOTAL_ALL},0) * 100, 2) AS foreign_pct,
          ROUND(${LOCAL_ALL}   / NULLIF(${TOTAL_ALL},0) * 100, 2) AS local_pct,
          Top_Buyer AS top_buyer, Top_Seller AS top_seller,
          Is_Split_Suspect AS is_split, Is_Reverse_Suspect AS is_reverse
        FROM ksei.monthly_snapshot
        WHERE Code = '${code}'
        ORDER BY Date DESC LIMIT 1
      `)

      return NextResponse.json({
        trend: trend12,
        composition,
        summary: (summary as any[])[0] ?? null,
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

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
