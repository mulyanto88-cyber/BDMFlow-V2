export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'

export async function GET(request: NextRequest) {
  const guarded = await guardApi(request, { pro: true })
  if (guarded) return guarded

  try {
    const { searchParams } = new URL(request.url)
    const preset = searchParams.get('preset') || 'all'

    // Base query
    let sql = `
      SELECT
        ks.stock_code,
        COALESCE(cp.company_name, cp.group_name, ks.stock_code) AS company_name,
        COALESCE(cp.sector, 'Other') AS sector,
        COALESCE(sl.close, dt.close, 0)::FLOAT8 AS close,
        COALESCE(sl.change_percent, dt.change_percent, 0)::FLOAT8 AS change_percent,
        COALESCE(sl.whale_signal, dt.whale_signal, false)::BOOLEAN AS whale_signal,
        COALESCE(sl.net_foreign_value, dt.net_foreign_value, 0)::FLOAT8 AS net_foreign_value,
        ks.market_cap_b::FLOAT8 AS market_cap_b,
        ks.enterprise_value_b::FLOAT8 AS enterprise_value_b,
        ks.shares_outstanding_b::FLOAT8 AS shares_outstanding_b,
        ks.free_float_pct::FLOAT8 AS free_float_pct,
        ks.pe_ratio_ttm::FLOAT8 AS pe_ratio_ttm,
        ks.pe_ratio_annualized::FLOAT8 AS pe_ratio_annualized,
        ks.forward_pe::FLOAT8 AS forward_pe,
        ks.pbv_ratio::FLOAT8 AS pbv_ratio,
        ks.ps_ratio::FLOAT8 AS ps_ratio,
        ks.ev_ebitda::FLOAT8 AS ev_ebitda,
        ks.peg_ratio::FLOAT8 AS peg_ratio,
        ks.earnings_yield_pct::FLOAT8 AS earnings_yield_pct,
        ks.p_fcf_ratio::FLOAT8 AS p_fcf_ratio,
        ks.eps_ttm::FLOAT8 AS eps_ttm,
        ks.bvps::FLOAT8 AS bvps,
        ks.roe_ttm_pct::FLOAT8 AS roe_ttm_pct,
        ks.roa_ttm_pct::FLOAT8 AS roa_ttm_pct,
        ks.roce_ttm_pct::FLOAT8 AS roce_ttm_pct,
        ks.gpm_quarter_pct::FLOAT8 AS gpm_quarter_pct,
        ks.opm_quarter_pct::FLOAT8 AS opm_quarter_pct,
        ks.npm_quarter_pct::FLOAT8 AS npm_quarter_pct,
        ks.revenue_growth_yoy_pct::FLOAT8 AS revenue_growth_yoy_pct,
        ks.net_income_growth_yoy::FLOAT8 AS net_income_growth_yoy,
        ks.debt_to_equity::FLOAT8 AS debt_to_equity,
        ks.current_ratio::FLOAT8 AS current_ratio,
        ks.quick_ratio::FLOAT8 AS quick_ratio,
        ks.interest_coverage::FLOAT8 AS interest_coverage,
        ks.piotroski_f_score::FLOAT8 AS piotroski_f_score,
        ks.altman_z_score::FLOAT8 AS altman_z_score,
        ks.revenue_ttm_b::FLOAT8 AS revenue_ttm_b,
        ks.net_income_ttm_b::FLOAT8 AS net_income_ttm_b,
        ks.cash_quarter_b::FLOAT8 AS cash_quarter_b,
        ks.total_assets_b::FLOAT8 AS total_assets_b,
        ks.total_equity_b::FLOAT8 AS total_equity_b,
        ks.free_cash_flow_ttm_b::FLOAT8 AS free_cash_flow_ttm_b,
        ks.period_latest,
        ks.updated_at::VARCHAR AS updated_at
      FROM market.company_keystats ks
      LEFT JOIN market.company_profile cp ON cp.stock_code = ks.stock_code
      LEFT JOIN market.tb_stock_latest sl ON sl.stock_code = ks.stock_code
      LEFT JOIN (
        SELECT stock_code, close, change_percent, whale_signal, net_foreign_value
        FROM market.daily_transactions
        WHERE trading_date = (SELECT MAX(trading_date) FROM market.daily_transactions)
      ) dt ON dt.stock_code = ks.stock_code
      WHERE ks.stock_code IS NOT NULL
        AND (ks.pe_ratio_ttm IS NOT NULL OR ks.pbv_ratio IS NOT NULL OR ks.roe_ttm_pct IS NOT NULL)
    `

    // Presets
    if (preset === 'undervalue') {
      sql += ` AND ks.pbv_ratio > 0 AND ks.pbv_ratio <= 1.5 AND ks.pe_ratio_ttm > 0 AND ks.pe_ratio_ttm <= 12 AND ks.roe_ttm_pct >= 8`
    } else if (preset === 'high_growth') {
      sql += ` AND ks.net_income_growth_yoy >= 20 AND ks.roe_ttm_pct >= 12`
    } else if (preset === 'quality') {
      sql += ` AND (ks.piotroski_f_score >= 6 OR ks.altman_z_score >= 2.6) AND ks.debt_to_equity <= 1.0 AND ks.roe_ttm_pct >= 10`
    } else if (preset === 'fcf_rich') {
      sql += ` AND ks.free_cash_flow_ttm_b > 0 AND ks.p_fcf_ratio > 0 AND ks.p_fcf_ratio <= 15`
    } else if (preset === 'hybrid_whale') {
      sql += ` AND ks.pe_ratio_ttm > 0 AND ks.pe_ratio_ttm <= 20 AND (sl.whale_signal = true OR dt.whale_signal = true)`
    }

    sql += ` ORDER BY ks.market_cap_b DESC NULLS LAST LIMIT 500`

    const data = await run(sql)
    return NextResponse.json({ data, total: data.length })
  } catch (err: any) {
    console.error('[screener-fundamental]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
