// /api/health/freshness — is the data we're serving actually current?
//
// Materialised tables fail quietly: when the nightly ETL breaks, every page keeps
// rendering yesterday's numbers with full confidence. This route makes that
// visible. Two independent signals, so a gap in either one still gets caught:
//
//   1. data_trading_date — the newest trading day present in the data
//   2. refreshed_at      — when the ETL last rebuilt the tables (manifest)
//
// The manifest only exists once the updated ETL has run, so its absence is
// reported as "unknown", never as an error.
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { guardApi } from '@/lib/guard'
import { expectedTradingDate, lagInDays, classify } from '@/lib/freshness'

export const revalidate = 900   // 15 min — cheap query, no need to re-ask often

// Public infrastructure status — rate-limited but never Pro-gated.
export async function GET(req: NextRequest) {
  const guarded = await guardApi(req, { pro: false })
  if (guarded) return guarded

  try {
    const [latest, manifest] = await Promise.all([
      run(`SELECT MAX(trading_date)::VARCHAR AS data_trading_date FROM market.daily_transactions`)
        .catch(() => [] as any[]),
      // Absent until the updated ETL has run once.
      run(`
        SELECT MAX(refreshed_at)::VARCHAR AS refreshed_at,
               COUNT(*)::INTEGER          AS tables_refreshed
        FROM main.tb_etl_manifest
      `).catch(() => [] as any[]),
    ])

    const dataDate = latest[0]?.data_trading_date?.slice(0, 10) ?? null
    const expected = expectedTradingDate()
    const lag = lagInDays(dataDate, expected)

    return NextResponse.json({
      status: classify(lag),
      dataTradingDate: dataDate,
      expectedTradingDate: expected,
      lagDays: lag,
      refreshedAt: manifest[0]?.refreshed_at ?? null,
      tablesRefreshed: manifest[0]?.tables_refreshed ?? null,
      manifestAvailable: manifest.length > 0,
    })
  } catch (err: any) {
    console.error('[health/freshness]', err.message)
    return NextResponse.json(
      { status: 'unknown', error: 'Gagal memeriksa kesegaran data.' },
      { status: 500 },
    )
  }
}
