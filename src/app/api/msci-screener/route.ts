export const revalidate = 3600

import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'

export async function GET(request: NextRequest) {
  const guarded = await guardApi(request, { pro: true })
  if (guarded) return guarded

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    
    const isDateValid = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam);
    const dateFilterSql = isDateValid ? `WHERE trading_date <= '${dateParam}'` : '';

    const sql = `
      WITH td AS (
        SELECT MAX(trading_date) AS target_date 
        FROM market.daily_transactions 
        ${dateFilterSql}
      ),
      base_data AS (
        SELECT d.stock_code, d.close, d.tradeable_shares
        FROM market.daily_transactions d, td
        WHERE d.trading_date = td.target_date
      ),
      market_cal AS (
        SELECT COUNT(DISTINCT trading_date)::FLOAT8 AS total_days_3m
        FROM market.daily_transactions, td
        WHERE trading_date > td.target_date - INTERVAL '90 days'
          AND trading_date <= td.target_date
      ),
      -- trading days in last 90d per stock — numerator for Frequency of Trading (FOT)
      fot_3m AS (
        SELECT stock_code,
               COUNT(*)::FLOAT8 AS days_3m
        FROM market.daily_transactions, td
        WHERE trading_date > td.target_date - INTERVAL '90 days'
          AND trading_date <= td.target_date
        GROUP BY stock_code
      ),
      -- MSCI ATVR uses the MONTHLY MEDIAN of daily traded value (robust to one-off block-trade
      -- spikes): per month = median(daily value) × trading days; summed over the window, then ×12.
      month_med AS (
        SELECT d.stock_code,
               date_trunc('month', d.trading_date) AS mth,
               -- SQL-standard median: DuckDB accepts it, Postgres has no median().
               (percentile_cont(0.5) WITHIN GROUP (ORDER BY d.value))::FLOAT8 AS med_daily,
               COUNT(*)::FLOAT8        AS days_in_month
        FROM market.daily_transactions d, td
        WHERE d.trading_date <= td.target_date
          AND d.trading_date >= date_trunc('month', td.target_date) - INTERVAL '11 months'
        GROUP BY d.stock_code, date_trunc('month', d.trading_date)
      ),
      atvr_med AS (
        SELECT mm.stock_code,
               SUM(mm.med_daily * mm.days_in_month) AS med_sum_12m,
               CAST(COUNT(*) AS FLOAT8) AS n_months_12m,
               SUM(mm.med_daily * mm.days_in_month) FILTER (
                 WHERE mm.mth >= (SELECT date_trunc('month', target_date) FROM td) - INTERVAL '2 months'
               ) AS med_sum_3m,
               CAST(COUNT(*) FILTER (
                 WHERE mm.mth >= (SELECT date_trunc('month', target_date) FROM td) - INTERVAL '2 months'
               ) AS FLOAT8) AS n_months_3m
        FROM month_med mm
        GROUP BY mm.stock_code
      ),
      hsc AS (
        SELECT share_code, SUM(percentage)::FLOAT8 AS top_holders_pct
        FROM ksei.tb_ownership_1pct_latest
        GROUP BY share_code
      )
      SELECT
        b.stock_code,
        cp.group_name    AS company_name,
        cp.sector,
        b.close::FLOAT8  AS close,
        b.tradeable_shares::BIGINT AS tradeable_shares,
        cp.free_float::FLOAT8      AS free_float,
        COALESCE(a3.days_3m, 0)        AS days_3m,
        mc.total_days_3m,
        COALESCE(am.med_sum_3m, 0)    AS med_sum_3m,
        COALESCE(am.n_months_3m, 0)   AS n_months_3m,
        COALESCE(am.med_sum_12m, 0)   AS med_sum_12m,
        COALESCE(am.n_months_12m, 0)  AS n_months_12m,
        COALESCE(h.top_holders_pct, 0) AS top_holders_pct,
        td.target_date
      FROM base_data b
      CROSS JOIN td
      CROSS JOIN market_cal mc
      LEFT JOIN market.company_profile cp  ON cp.stock_code  = b.stock_code
      LEFT JOIN fot_3m   a3               ON a3.stock_code  = b.stock_code
      LEFT JOIN atvr_med am               ON am.stock_code  = b.stock_code
      LEFT JOIN hsc h                     ON h.share_code   = b.stock_code
      WHERE b.tradeable_shares > 0
        AND cp.free_float > 0
        AND b.close > 0
    `;

    const data = await run(sql);
    return NextResponse.json({ data, target_date: data.length > 0 ? data[0].target_date : null });
  } catch (err: any) {
    console.error('[msci-screener]', err.message);
    return NextResponse.json({ error: 'Gagal mengambil data. Silakan coba lagi.' }, { status: 500 });
  }
}
