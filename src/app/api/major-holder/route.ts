export const dynamic = 'force-dynamic'

// src/app/api/major-holder/route.ts
// Data source: ksei.data5_mutasi (KSEI >5% daily PDF)
// Key insight: ~23% of activity = account transfers (not real buy/sell)
// Transfer detection: Reduction→0 + Buying same day/stock/amount ±0.1%
import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'

// ── CTE untuk deteksi account transfers ──────────────────────────────────────
// Transfer = pemegang sama ganti nama rekening; bukan real jual/beli
const TRANSFER_CTE = `
  transfers AS (
    SELECT DISTINCT r.tanggal_data, r.kode_efek
    FROM ksei.data5_mutasi r
    WHERE r.aksi = 'Reduction' AND r.jumlah_saham_curr = 0
      AND EXISTS (
        SELECT 1 FROM ksei.data5_mutasi b
        WHERE b.tanggal_data = r.tanggal_data
          AND b.kode_efek = r.kode_efek
          AND b.aksi IN ('Buying','Accumulation')
          AND ABS(b.jumlah_saham_curr::DOUBLE - r.jumlah_saham_prev::DOUBLE)
              / NULLIF(r.jumlah_saham_prev::DOUBLE, 0) < 0.001
      )
  )
`

// Status helper: L/D = Lokal, A = Asing
const lf = (col = 'd.status') =>
  `CASE WHEN ${col} IN ('L','D') THEN 'Lokal' WHEN ${col} = 'A' THEN 'Asing' ELSE '—' END`

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action       = searchParams.get('action') || 'changes'
  const days         = Math.min(parseInt(searchParams.get('days') || '30'), 90)
  const code         = (searchParams.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const filterLF     = searchParams.get('lf') || 'all'  // 'all' | 'lokal' | 'asing'
  const hideTransfer = searchParams.get('hide_transfer') !== 'false'  // default: hide transfers

  const codeFilter = code ? `AND d.kode_efek = '${code}'` : ''
  const lfFilter   = filterLF === 'lokal' ? `AND d.status IN ('L','D')`
                   : filterLF === 'asing'  ? `AND d.status = 'A'`
                   : ''
  const transFilter = hideTransfer
    ? `AND t.kode_efek IS NULL`   // exclude transfers
    : ''

  try {
    // ════════════════════════════════════════════════════════════════════════
    // SEMUA PERUBAHAN — non-holding, dengan flag is_transfer
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'changes') {
      const data = await run(`
        WITH ${TRANSFER_CTE}
        SELECT
          d.tanggal_data::VARCHAR              AS tanggal,
          d.kode_efek                          AS stock_code,
          d.nama_pemegang_saham                AS holder_name,
          d.jumlah_saham_prev::BIGINT          AS shares_prev,
          d.jumlah_saham_curr::BIGINT          AS shares_curr,
          d.perubahan_saham::BIGINT            AS shares_change,
          d.aksi,
          ${lf()} AS lf,
          CASE WHEN t.kode_efek IS NOT NULL THEN true ELSE false END AS is_transfer,
          cp.sector, cp.group_name,
          l.close::DOUBLE                      AS current_price,
          l.change_percent::DOUBLE             AS change_pct
        FROM ksei.data5_mutasi d
        LEFT JOIN transfers t  ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
        LEFT JOIN market.company_profile cp ON d.kode_efek = cp.stock_code
        LEFT JOIN market.tb_stock_latest  l ON d.kode_efek = l.stock_code
        WHERE d.tanggal_data >= CURRENT_DATE - ${days}
          AND d.aksi != 'Holding'
          ${codeFilter} ${lfFilter} ${transFilter}
        ORDER BY d.tanggal_data DESC, ABS(d.perubahan_saham) DESC
        LIMIT 300
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // FRESH ACCUMULATION — real buying (exclude transfers by default)
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'accumulation') {
      const data = await run(`
        WITH ${TRANSFER_CTE}
        SELECT
          d.tanggal_data::VARCHAR              AS tanggal,
          d.kode_efek                          AS stock_code,
          d.nama_pemegang_saham                AS holder_name,
          d.jumlah_saham_prev::BIGINT          AS shares_prev,
          d.jumlah_saham_curr::BIGINT          AS shares_curr,
          d.perubahan_saham::BIGINT            AS shares_change,
          d.aksi,
          ${lf()} AS lf,
          CASE WHEN t.kode_efek IS NOT NULL THEN true ELSE false END AS is_transfer,
          cp.sector, cp.group_name,
          l.close::DOUBLE                      AS current_price,
          l.change_percent::DOUBLE             AS change_pct
        FROM ksei.data5_mutasi d
        LEFT JOIN transfers t  ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
        LEFT JOIN market.company_profile cp ON d.kode_efek = cp.stock_code
        LEFT JOIN market.tb_stock_latest  l ON d.kode_efek = l.stock_code
        WHERE d.tanggal_data >= CURRENT_DATE - ${days}
          AND d.aksi IN ('Buying','Accumulation')
          ${codeFilter} ${lfFilter}
          AND t.kode_efek IS NULL  -- always exclude transfers here
        ORDER BY d.tanggal_data DESC, d.perubahan_saham DESC
        LIMIT 300
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // DISTRIBUTION ALERT — real reduction + ghost whale
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'distribution') {
      const data = await run(`
        WITH ${TRANSFER_CTE}
        SELECT
          d.tanggal_data::VARCHAR              AS tanggal,
          d.kode_efek                          AS stock_code,
          d.nama_pemegang_saham                AS holder_name,
          d.jumlah_saham_prev::BIGINT          AS shares_prev,
          d.jumlah_saham_curr::BIGINT          AS shares_curr,
          d.perubahan_saham::BIGINT            AS shares_change,
          d.aksi,
          CASE WHEN d.jumlah_saham_curr = 0 THEN 'Ghost Whale' ELSE 'Reduction' END AS alert_type,
          ${lf()} AS lf,
          CASE WHEN t.kode_efek IS NOT NULL THEN true ELSE false END AS is_transfer,
          cp.sector, cp.group_name,
          l.close::DOUBLE                      AS current_price,
          l.change_percent::DOUBLE             AS change_pct
        FROM ksei.data5_mutasi d
        LEFT JOIN transfers t  ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
        LEFT JOIN market.company_profile cp ON d.kode_efek = cp.stock_code
        LEFT JOIN market.tb_stock_latest  l ON d.kode_efek = l.stock_code
        WHERE d.tanggal_data >= CURRENT_DATE - ${days}
          AND d.aksi = 'Reduction'
          ${codeFilter} ${lfFilter}
          AND t.kode_efek IS NULL  -- always exclude transfers here
        ORDER BY d.tanggal_data DESC, ABS(d.perubahan_saham) DESC
        LIMIT 300
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // ACTIVE HOLDINGS — snapshot terkini
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'holdings') {
      const data = await run(`
        WITH latest AS (SELECT MAX(tanggal_data) AS max_date FROM ksei.data5_mutasi)
        SELECT
          d.kode_efek                          AS stock_code,
          d.nama_pemegang_saham                AS holder_name,
          d.jumlah_saham_curr::BIGINT          AS current_shares,
          d.aksi,
          d.tanggal_data::VARCHAR              AS last_update,
          ${lf()} AS lf,
          cp.sector, cp.group_name,
          l.close::DOUBLE                      AS current_price,
          l.change_percent::DOUBLE             AS change_pct,
          l.value::BIGINT                      AS daily_value
        FROM ksei.data5_mutasi d
        CROSS JOIN latest
        LEFT JOIN market.company_profile cp ON d.kode_efek = cp.stock_code
        LEFT JOIN market.tb_stock_latest  l ON d.kode_efek = l.stock_code
        WHERE d.tanggal_data = latest.max_date
          AND d.jumlah_saham_curr > 0
          ${codeFilter} ${lfFilter}
        ORDER BY d.kode_efek, d.jumlah_saham_curr DESC
        LIMIT 500
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // TREND — weekly activity summary
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'trend') {
      const data = await run(`
        WITH ${TRANSFER_CTE}
        SELECT
          DATE_TRUNC('week', d.tanggal_data)::DATE::VARCHAR AS week,
          COUNT(DISTINCT d.kode_efek)                        AS saham_aktif,
          COUNT(CASE WHEN d.aksi IN ('Buying','Accumulation') AND t.kode_efek IS NULL THEN 1 END) AS real_akumulasi,
          COUNT(CASE WHEN d.aksi = 'Reduction' AND t.kode_efek IS NULL THEN 1 END)               AS real_distribusi,
          COUNT(CASE WHEN t.kode_efek IS NOT NULL THEN 1 END)                                     AS transfers,
          COUNT(DISTINCT CASE WHEN d.aksi != 'Holding' THEN d.nama_pemegang_saham END)            AS pemegang_aktif
        FROM ksei.data5_mutasi d
        LEFT JOIN transfers t ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
        WHERE d.aksi != 'Holding'
          AND d.tanggal_data >= CURRENT_DATE - 120
        GROUP BY 1 ORDER BY 1 DESC
        LIMIT 20
      `)
      return NextResponse.json({ data })
    }

    // ════════════════════════════════════════════════════════════════════════
    // SAHAM DETAIL — deep dive per saham
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'saham_detail' && code) {
      const [holders, recent] = await Promise.all([
        // Current holders
        run(`
          WITH latest AS (SELECT MAX(tanggal_data) AS max_date FROM ksei.data5_mutasi)
          SELECT
            d.nama_pemegang_saham                AS holder_name,
            d.jumlah_saham_curr::BIGINT          AS current_shares,
            d.aksi,
            ${lf()} AS lf,
            d.tanggal_data::VARCHAR              AS last_update
          FROM ksei.data5_mutasi d
          CROSS JOIN latest
          WHERE d.tanggal_data = latest.max_date
            AND d.kode_efek = '${code}'
            AND d.jumlah_saham_curr > 0
          ORDER BY d.jumlah_saham_curr DESC
          LIMIT 50
        `),
        // Recent 30D activity (exclude transfers)
        run(`
          WITH ${TRANSFER_CTE}
          SELECT
            d.tanggal_data::VARCHAR              AS tanggal,
            d.nama_pemegang_saham                AS holder_name,
            d.jumlah_saham_prev::BIGINT          AS shares_prev,
            d.jumlah_saham_curr::BIGINT          AS shares_curr,
            d.perubahan_saham::BIGINT            AS shares_change,
            d.aksi,
            ${lf()} AS lf,
            CASE WHEN t.kode_efek IS NOT NULL THEN true ELSE false END AS is_transfer
          FROM ksei.data5_mutasi d
          LEFT JOIN transfers t ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
          WHERE d.tanggal_data >= CURRENT_DATE - 30
            AND d.kode_efek = '${code}'
            AND d.aksi != 'Holding'
          ORDER BY d.tanggal_data DESC, ABS(d.perubahan_saham) DESC
          LIMIT 100
        `),
      ])
      return NextResponse.json({ holders, recent })
    }

    // ════════════════════════════════════════════════════════════════════════
    // KPI SUMMARY — stats untuk header cards
    // ════════════════════════════════════════════════════════════════════════
    if (action === 'kpi') {
      const data = await run(`
        WITH ${TRANSFER_CTE},
        latest AS (SELECT MAX(tanggal_data) AS max_date FROM ksei.data5_mutasi),
        period AS (SELECT CURRENT_DATE - 30 AS start_date)
        SELECT
          (SELECT COUNT(*) FROM ksei.data5_mutasi d2 CROSS JOIN latest
           WHERE d2.tanggal_data = latest.max_date AND d2.jumlah_saham_curr > 0
          ) AS active_holdings,
          COUNT(DISTINCT CASE WHEN d.aksi IN ('Buying','Accumulation') AND d.tanggal_data >= (SELECT start_date FROM period)
                               AND t.kode_efek IS NULL THEN d.kode_efek END) AS akumulasi_30d,
          COUNT(DISTINCT CASE WHEN d.aksi = 'Reduction' AND d.tanggal_data >= (SELECT start_date FROM period)
                               AND t.kode_efek IS NULL THEN d.kode_efek END) AS distribusi_30d,
          COUNT(DISTINCT CASE WHEN d.aksi = 'Reduction' AND d.jumlah_saham_curr = 0
                               AND d.tanggal_data >= (SELECT start_date FROM period)
                               AND t.kode_efek IS NULL THEN d.nama_pemegang_saham END) AS ghost_whale_30d,
          ROUND(COUNT(CASE WHEN t.kode_efek IS NOT NULL AND d.tanggal_data >= (SELECT start_date FROM period) THEN 1 END) * 100.0
              / NULLIF(COUNT(CASE WHEN d.aksi != 'Holding' AND d.tanggal_data >= (SELECT start_date FROM period) THEN 1 END), 0), 1) AS transfer_pct
        FROM ksei.data5_mutasi d
        LEFT JOIN transfers t ON t.tanggal_data = d.tanggal_data AND t.kode_efek = d.kode_efek
      `)
      return NextResponse.json({ data: (data as any[])[0] ?? {} })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
