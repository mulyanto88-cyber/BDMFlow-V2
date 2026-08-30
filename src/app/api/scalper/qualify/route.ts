import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'
import { run } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = [
  'mulyanto.my88@gmail.com',
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
]

export interface ScalperStockResult {
  stock_code: string
  trading_date: string
  close: number
  previous: number
  change_percent: number
  volume: number
  value: number
  val_kemarin_miliar: number
  avg_val_20d_miliar: number
  market_cap_triliun: number
  vol_vs_ma20_ratio: number
  aov_ratio_ma20: number
  whale_signal: boolean
  big_player_anomaly: boolean
  net_foreign_value: number
  vwma_20d: number
  is_above_vwma20: boolean
  sector: string
  smart_money_score: number
  tier_v2: string
  flow_context: string
  liner_tier: 'TIER_1_BLUE_CHIP' | 'SECOND_LINER' | 'THIRD_LINER_SMALL'
  scalper_score: number
  grade: 'SUPER_POTENTIAL' | 'STRONG_BUY' | 'WATCH' | 'AVOID'
  is_gocap: boolean
}

export async function POST(req: NextRequest) {
  try {
    const viewer = await getViewer(req)
    if (!viewer.userId) {
      return NextResponse.json({ error: 'Unauthorized: Login required.' }, { status: 401 })
    }

    const admin = getAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Database service role unavailable.' }, { status: 500 })
    }

    // Verify caller is admin
    const { data: userRecord, error: userErr } = await admin.auth.admin.getUserById(viewer.userId)
    const email = userRecord?.user?.email?.toLowerCase()

    if (userErr || !email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Forbidden: Private Admin tool only.' }, { status: 403 })
    }

    const body = await req.json()
    const rawCodes: string[] = body.codes || []

    // Clean & sanitize codes (extract 4-letter uppercase tickers)
    const cleanCodes = Array.from(
      new Set(
        rawCodes
          .map((c) => String(c).trim().toUpperCase())
          .filter((c) => /^[A-Z]{4}$/.test(c))
      )
    ).slice(0, 100) // Max 100 tickers per batch

    if (cleanCodes.length === 0) {
      return NextResponse.json({ error: 'Tidak ada kode saham 4 huruf valid yang terdeteksi.' }, { status: 400 })
    }

    const query = `
      WITH latest_date AS (
        SELECT MAX(trading_date) AS max_date FROM market.daily_transactions
      ),
      latest_metrics AS (
        SELECT 
          d.stock_code,
          d.trading_date,
          d.close,
          d.previous,
          d.change_percent,
          d.volume,
          d.value,
          d.frequency,
          d.vwma_20d,
          d.ma20_volume,
          d.tradeable_shares,
          (COALESCE(d.tradeable_shares, 0) * d.close) AS market_cap,
          (COALESCE(d.ma20_volume, 0) * d.close) AS ma20_value,
          d.avg_order_volume,
          d.aov_ratio_ma20,
          d.whale_signal,
          d.big_player_anomaly,
          d.signal,
          d.net_foreign_value,
          ROUND((d.volume::NUMERIC / NULLIF(d.ma20_volume, 0)), 2) AS vol_vs_ma20_ratio
        FROM market.daily_transactions d
        JOIN latest_date l ON d.trading_date = l.max_date
        WHERE d.stock_code = ANY($1::VARCHAR[])
      ),
      smart_money AS (
        SELECT 
          s.stock_code,
          s.sector,
          s.foreign_30d,
          s.broker_net,
          ROUND((COALESCE(v2.v2_score, 0) / 73.0 * 100)::NUMERIC, 0) AS smart_money_score,
          v2.tier_v2,
          v2.flow_context
        FROM market.tb_smart_money_score s
        LEFT JOIN market.tb_composite_v2 v2 ON v2.stock_code = s.stock_code
        WHERE s.stock_code = ANY($1::VARCHAR[])
      )
      SELECT 
        m.stock_code,
        m.trading_date,
        m.close,
        m.previous,
        m.change_percent,
        m.volume,
        m.value,
        ROUND((m.value / 1e9)::NUMERIC, 2) AS val_kemarin_miliar,
        ROUND((m.ma20_value / 1e9)::NUMERIC, 2) AS avg_val_20d_miliar,
        ROUND((m.market_cap / 1e12)::NUMERIC, 2) AS market_cap_triliun,
        COALESCE(m.vol_vs_ma20_ratio, 1.0) AS vol_vs_ma20_ratio,
        COALESCE(m.aov_ratio_ma20, 1.0) AS aov_ratio_ma20,
        COALESCE(m.whale_signal, false) AS whale_signal,
        COALESCE(m.big_player_anomaly, false) AS big_player_anomaly,
        COALESCE(m.net_foreign_value, 0) AS net_foreign_value,
        COALESCE(m.vwma_20d, m.close) AS vwma_20d,
        (m.close >= COALESCE(m.vwma_20d, 0)) AS is_above_vwma20,
        COALESCE(sm.sector, 'Lainnya') AS sector,
        COALESCE(sm.smart_money_score, 50) AS smart_money_score,
        COALESCE(sm.tier_v2, 'NEUTRAL') AS tier_v2,
        COALESCE(sm.flow_context, 'NORMAL') AS flow_context,

        -- Liner / Market Cap Tier Classification
        CASE 
          WHEN m.market_cap >= 50e12 OR m.ma20_value >= 40e9 THEN 'TIER_1_BLUE_CHIP'
          WHEN m.market_cap >= 5e12 OR m.ma20_value >= 5e9 THEN 'SECOND_LINER'
          ELSE 'THIRD_LINER_SMALL'
        END AS liner_tier,

        -- Scalper Quality Score (0 - 100)
        ROUND(
          LEAST(100, GREATEST(0,
            (CASE WHEN m.close <= 50 THEN -30 ELSE 0 END) +
            (CASE WHEN m.vol_vs_ma20_ratio >= 1.5 THEN 35 WHEN m.vol_vs_ma20_ratio >= 1.0 THEN 20 ELSE 5 END) +
            (CASE WHEN m.aov_ratio_ma20 >= 1.5 THEN 25 WHEN m.aov_ratio_ma20 >= 1.0 THEN 15 ELSE 5 END) +
            (COALESCE(sm.smart_money_score, 50) * 0.25) +
            (CASE WHEN m.close >= COALESCE(m.vwma_20d, 0) THEN 15 ELSE 0 END)
          ))::NUMERIC, 0
        ) AS scalper_score
      FROM latest_metrics m
      LEFT JOIN smart_money sm ON m.stock_code = sm.stock_code
      ORDER BY scalper_score DESC, m.vol_vs_ma20_ratio DESC;
    `

    const rows = await run<any>(query, [cleanCodes])

    // Annotate grades & flags
    const results: ScalperStockResult[] = rows.map((r: any) => {
      const score = Number(r.scalper_score) || 0
      const isGocap = Number(r.close) <= 50

      let grade: ScalperStockResult['grade'] = 'AVOID'
      if (!isGocap) {
        if (score >= 80) grade = 'SUPER_POTENTIAL'
        else if (score >= 65) grade = 'STRONG_BUY'
        else if (score >= 45) grade = 'WATCH'
      }

      return {
        ...r,
        val_kemarin_miliar: Number(r.val_kemarin_miliar) || 0,
        avg_val_20d_miliar: Number(r.avg_val_20d_miliar) || 0,
        market_cap_triliun: Number(r.market_cap_triliun) || 0,
        vol_vs_ma20_ratio: Number(r.vol_vs_ma20_ratio) || 0,
        aov_ratio_ma20: Number(r.aov_ratio_ma20) || 0,
        smart_money_score: Number(r.smart_money_score) || 0,
        scalper_score: score,
        grade,
        is_gocap: isGocap,
      }
    })

    // Track any stock codes not found in our DB
    const foundCodes = new Set(results.map((r) => r.stock_code))
    const notFoundCodes = cleanCodes.filter((c) => !foundCodes.has(c))

    return NextResponse.json({
      success: true,
      totalRequested: cleanCodes.length,
      totalFound: results.length,
      results,
      notFoundCodes,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error('[scalper-qualify] error:', err.message)
    return NextResponse.json({ error: err?.message || 'Gagal memproses analisis saham.' }, { status: 500 })
  }
}
