export const revalidate = 1800

import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

// FTSE GEIS liquidity test = median daily TRADING VOLUME per month ÷ free-float shares.
// Entry (non-constituent) bar 0.05% for ≥10/12 months; retention bar 0.04% for ≥8/12 months.
// We count, per stock, how many of the last 12 calendar months clear each bar; the page applies
// the months-required test + free-float + size. (free-float shares = total shares × free_float%.)
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
      -- free-float shares per stock (total listed shares × free_float%)
      ffs AS (
        SELECT b.stock_code,
               (b.tradeable_shares * cp.free_float / 100.0) AS ff_shares
        FROM base_data b
        JOIN market.company_profile cp ON cp.stock_code = b.stock_code
        WHERE cp.free_float > 0
      ),
      -- monthly median of daily volume over the trailing 12 calendar months
      month_vol AS (
        SELECT d.stock_code,
               date_trunc('month', d.trading_date) AS mth,
               median(d.volume)::DOUBLE AS med_vol
        FROM market.daily_transactions d, td
        WHERE d.trading_date <= td.target_date
          AND d.trading_date >= date_trunc('month', td.target_date) - INTERVAL '11 months'
        GROUP BY d.stock_code, date_trunc('month', d.trading_date)
      ),
      liq AS (
        SELECT mv.stock_code,
               CAST(COUNT(*) AS DOUBLE) AS n_months,
               CAST(COUNT(*) FILTER (WHERE mv.med_vol >= 0.0005 * f.ff_shares) AS DOUBLE) AS months_entry,
               CAST(COUNT(*) FILTER (WHERE mv.med_vol >= 0.0004 * f.ff_shares) AS DOUBLE) AS months_retain,
               median(mv.med_vol / NULLIF(f.ff_shares, 0) * 100) AS median_daily_pct
        FROM month_vol mv
        JOIN ffs f ON f.stock_code = mv.stock_code
        GROUP BY mv.stock_code
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
        COALESCE(l.n_months, 0)         AS n_months,
        COALESCE(l.months_entry, 0)     AS months_entry,
        COALESCE(l.months_retain, 0)    AS months_retain,
        COALESCE(l.median_daily_pct, 0) AS median_daily_pct,
        COALESCE(h.top_holders_pct, 0)  AS top_holders_pct,
        td.target_date
      FROM base_data b
      CROSS JOIN td
      LEFT JOIN market.company_profile cp  ON cp.stock_code  = b.stock_code
      LEFT JOIN liq l                      ON l.stock_code   = b.stock_code
      LEFT JOIN hsc h                      ON h.share_code   = b.stock_code
      WHERE b.tradeable_shares > 0
        AND cp.free_float > 0
        AND b.close > 0
    `;

    const data = await run(sql);
    return NextResponse.json({ data, target_date: data.length > 0 ? data[0].target_date : null });
  } catch (err: any) {
    console.error('[ftse-screener]', err.message);
    return NextResponse.json({ error: err.message ?? 'Gagal mengambil data.' }, { status: 500 });
  }
}
