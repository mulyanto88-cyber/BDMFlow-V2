export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

export async function GET(request: Request) {
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
        SELECT COUNT(DISTINCT trading_date)::DOUBLE AS total_days_3m
        FROM market.daily_transactions, td
        WHERE trading_date > td.target_date - INTERVAL '90 days'
          AND trading_date <= td.target_date
      ),
      atvr_3m AS (
        SELECT stock_code,
               SUM(value)::DOUBLE AS sum_value_3m,
               COUNT(*)::DOUBLE   AS days_3m
        FROM market.daily_transactions, td
        WHERE trading_date > td.target_date - INTERVAL '90 days'
          AND trading_date <= td.target_date
        GROUP BY stock_code
      ),
      atvr_12m AS (
        SELECT stock_code,
               SUM(value)::DOUBLE AS sum_value_12m,
               COUNT(*)::DOUBLE   AS days_12m
        FROM market.daily_transactions, td
        WHERE trading_date > td.target_date - INTERVAL '365 days'
          AND trading_date <= td.target_date
        GROUP BY stock_code
      ),
      hsc AS (
        SELECT share_code, SUM(percentage)::DOUBLE AS top_holders_pct
        FROM ksei.vw_ownership_1pct_latest
        GROUP BY share_code
      )
      SELECT
        b.stock_code,
        cp.group_name    AS company_name,
        cp.sector,
        b.close::DOUBLE  AS close,
        b.tradeable_shares::BIGINT AS tradeable_shares,
        cp.free_float::DOUBLE      AS free_float,
        COALESCE(a3.sum_value_3m, 0)  AS sum_value_3m,
        COALESCE(a3.days_3m, 0)       AS days_3m,
        COALESCE(a12.sum_value_12m,0) AS sum_value_12m,
        COALESCE(a12.days_12m, 0)     AS days_12m,
        mc.total_days_3m,
        COALESCE(h.top_holders_pct, 0) AS top_holders_pct,
        td.target_date
      FROM base_data b
      CROSS JOIN td
      CROSS JOIN market_cal mc
      LEFT JOIN market.company_profile cp  ON cp.stock_code  = b.stock_code
      LEFT JOIN atvr_3m  a3               ON a3.stock_code  = b.stock_code
      LEFT JOIN atvr_12m a12              ON a12.stock_code = b.stock_code
      LEFT JOIN hsc h                     ON h.share_code   = b.stock_code
      WHERE b.tradeable_shares > 0
        AND cp.free_float > 0
        AND b.close > 0
    `;

    const data = await run(sql);
    return NextResponse.json({ data, target_date: data.length > 0 ? data[0].target_date : null });
  } catch (err: any) {
    console.error('[msci-screener]', err.message);
    return NextResponse.json({ error: err.message ?? 'Gagal mengambil data.' }, { status: 500 });
  }
}
