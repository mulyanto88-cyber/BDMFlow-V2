import { NextResponse } from 'next/server'
import { runQuery } from '@/lib/db'
import { getCacheStats } from '@/lib/cache'

export const dynamic = 'force-dynamic'

// ── Jejak bandar, dari tape broker saja ──────────────────────────────────────
//
// KSEI sengaja tidak dipakai: bulanan dan terlambat berminggu-minggu, jadi tidak
// bisa menginformasikan sinyal swing.
//
// Semua yang ditampilkan sudah dibacktest pada Jan–Jul 2026 (~132 hari bursa;
// Agu–Des 2025 kosong sama sekali di broker_activity). Edge return-20-hari:
//
//   tekanan broker kuintil-5 (share x agresi)   +2,45 pp   ← sinyal utama
//   smart beli + harga di bawah cost bandar     +1,76 pp   ← pendukung
//   konsisten 4–5 dari 5 hari                   +1,43 pp
//   smart net beli > 5 M                        −2,54 pp   ← sengaja tidak dipakai
//
// DIUJI DAN DITOLAK — sengaja tidak dibangun:
//   • Transisi "menampung → mengejar": return 20h justru terburuk (−2,80). Yang
//     berpengaruh adalah LEVEL agresi, bukan perubahannya.
//   • PIR sebagai filter sinyal: edge bandar tetap positif di keempat kuartil PIR,
//     jadi PIR dipakai sebagai label RISIKO, bukan syarat sinyal.
//   • Divergensi smart vs retail: tape zero-sum, retail_net = −smart_net persis.
//
// Batas klaim:
//  1. broker_activity menyimpan SATU baris net per broker per hari, jadi avg_price
//     mencampur kedua sisi. Untuk broker net beli itu mendekati harga beli — cukup
//     untuk memeringkat, tidak cukup untuk klaim presisi.
//  2. Kode broker bukan satu orang. Yang benar: "aliran order lewat broker X".
//  3. Satu rezim pasar 7 bulan, seluruhnya bearish. Edge bersifat RELATIF, dan win
//     rate mengikuti pasar (56–64% saat naik, 12–21% saat turun) — karena itu
//     route ini ikut mengirim `market`.

const SIGNAL_SQL = `
  WITH latest AS (SELECT MAX(trading_date) AS d FROM market.daily_transactions),
  px AS (
    SELECT dt.stock_code, dt.trading_date, dt.change_percent, dt.volume, dt.value,
           dt.tradeable_shares,
           dt.value / NULLIF(dt.volume,0) AS vwap,
           ROW_NUMBER() OVER (PARTITION BY dt.stock_code ORDER BY dt.trading_date DESC) AS rn
    FROM market.daily_transactions dt CROSS JOIN latest l
    WHERE dt.trading_date >= l.d - INTERVAL '45 days'
      AND dt.close > 0 AND dt.volume > 0
  ),
  -- PIR mengikuti definisi BEI: perubahan harga / (rata-rata volume / free float).
  -- Bukan ukuran likuiditas melainkan konsentrasi: harga bergerak besar padahal
  -- hanya sedikit float yang benar-benar berpindah tangan.
  pir_raw AS (
    SELECT stock_code,
      AVG(ABS(change_percent)) AS avg_abs_chg,
      AVG(volume)              AS avg_vol,
      MAX(tradeable_shares)    AS shares
    FROM px WHERE rn <= 20 GROUP BY stock_code
  ),
  pir_scored AS (
    SELECT r.stock_code,
      r.avg_vol / NULLIF(r.shares * sl.free_float / 100.0, 0) AS velocity,
      r.avg_abs_chg / NULLIF(r.avg_vol / NULLIF(r.shares * sl.free_float/100.0, 0), 0) AS pir
    FROM pir_raw r
    JOIN market.tb_stock_latest sl ON sl.stock_code = r.stock_code
    WHERE sl.free_float > 0 AND r.shares > 0
  ),
  -- Tape broker. Jendela dihitung per HARI BURSA, bukan tanggal kalender:
  -- broker_activity berlubang, aritmetika tanggal akan melompati hari yang hilang.
  bdaily AS (
    SELECT ba.stock_code, ba.date,
      SUM(CASE WHEN UPPER(bc.category) IN ('FOREIGN','LOCAL_INST') THEN ba.value ELSE 0 END) AS smart_net,
      SUM(CASE WHEN UPPER(bc.category) IN ('FOREIGN','LOCAL_INST') AND ba.value>0 THEN ba.value ELSE 0 END) AS sbuy,
      SUM(CASE WHEN UPPER(bc.category) IN ('FOREIGN','LOCAL_INST') AND ba.value>0 THEN ba.avg_price*ba.value ELSE 0 END) AS spx
    FROM main.broker_activity ba
    JOIN main.broker_classification bc ON bc.broker_code = ba.broker_code
    CROSS JOIN latest l
    WHERE LENGTH(ba.stock_code) = 4          -- waran mencemari net broker
      AND ba.date >= l.d - INTERVAL '20 days'
    GROUP BY ba.stock_code, ba.date
  ),
  bseq AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY stock_code ORDER BY date DESC) AS rn FROM bdaily),
  agg AS (
    SELECT stock_code,
      SUM(smart_net)/1e9                           AS smart_bn,
      SUM(spx)/NULLIF(SUM(sbuy),0)                 AS bandar_cost,
      SUM(CASE WHEN smart_net>0 THEN 1 ELSE 0 END) AS up_days,
      COUNT(*)                                     AS days
    FROM bseq WHERE rn <= 5 GROUP BY stock_code
  ),
  -- Siapa yang mendorong harga pada hari terakhir.
  --   agresi  = (harga rata-rata broker − VWAP) / VWAP  → membayar di atas pasar
  --   share   = nilai broker / nilai transaksi hari itu → seberapa besar porsinya
  --   tekanan = share x agresi                          → dorongan mekanis
  -- Diukur PER BROKER, bukan per kohort: menggabungkan kohort membuat satu broker
  -- yang mengangkat harga saling meniadakan dengan yang menunggu di bid, dan
  -- sinyalnya hilang (agresi kohort hanya +0,31% vs +1,90% di kuintil-5 per broker).
  pressure AS (
    SELECT ba.stock_code, ba.broker_code, ba.broker_name,
      ba.value / NULLIF(p.value,0)                                                          AS share,
      (ba.avg_price - p.vwap) / NULLIF(p.vwap,0) * 100                                      AS agresi,
      (ba.value / NULLIF(p.value,0)) * ((ba.avg_price - p.vwap) / NULLIF(p.vwap,0) * 100)   AS tekanan
    FROM main.broker_activity ba
    JOIN main.broker_classification bc ON bc.broker_code = ba.broker_code
    JOIN px p ON p.stock_code = ba.stock_code AND p.trading_date = ba.date AND p.rn = 1
    WHERE LENGTH(ba.stock_code) = 4
      AND UPPER(bc.category) IN ('FOREIGN','LOCAL_INST')
      AND ba.value > 0 AND ba.avg_price > 0
  ),
  top_pressure AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY stock_code ORDER BY tekanan DESC) AS rk
    FROM pressure
  )
  SELECT
    a.stock_code,
    l.sector,
    l.close::DOUBLE                                                  AS close,
    ROUND(l.change_percent::DOUBLE, 2)                               AS change_percent,
    ROUND(a.smart_bn, 2)                                             AS smart_net_bn,
    a.up_days::INTEGER                                               AS up_days,
    ROUND(a.bandar_cost, 0)                                          AS bandar_cost,
    ROUND((l.close - a.bandar_cost)/NULLIF(a.bandar_cost,0)*100, 2)  AS vs_cost_pct,
    ROUND(l.value::DOUBLE/1e9, 1)                                    AS turnover_bn,
    l.whale_signal::BOOLEAN                                          AS whale_signal,
    (a.up_days >= 4)                                                 AS konsisten,
    ((l.close - a.bandar_cost)/NULLIF(a.bandar_cost,0) < 0)          AS bandar_nyangkut,
    tp.broker_code                                                   AS pusher,
    tp.broker_name                                                   AS pusher_name,
    ROUND(tp.share * 100, 1)                                         AS pusher_share_pct,
    ROUND(tp.agresi, 2)                                              AS pusher_agresi_pct,
    ROUND(tp.tekanan, 3)                                             AS pusher_tekanan,
    -- Ambang kuintil-5 backtest: tekanan rata-rata Q5 = 0,21; batas bawahnya ~0,10.
    (tp.tekanan >= 0.10)                                             AS pusher_kuat,
    ROUND(ps.pir, 0)                                                 AS pir,
    ROUND(ps.velocity * 100, 3)                                      AS velocity_pct,
    CASE
      WHEN ps.velocity IS NULL     THEN 'tidak_diketahui'
      WHEN ps.velocity < 0.005     THEN 'float_tipis'    -- <0,5% float/hari: profil HSC
      WHEN ps.velocity > 0.08      THEN 'churn_tinggi'   -- >8% float/hari: spekulatif
      ELSE 'wajar'
    END                                                              AS zona_risiko
  FROM agg a
  JOIN market.tb_stock_latest l ON l.stock_code = a.stock_code
  LEFT JOIN top_pressure tp ON tp.stock_code = a.stock_code AND tp.rk = 1
  LEFT JOIN pir_scored ps ON ps.stock_code = a.stock_code
  WHERE a.days >= 4                       -- jendela harus terbentuk penuh
    AND l.value >= 1000000000             -- likuiditas layak transaksi
    AND a.bandar_cost > 0
    AND a.smart_bn > 0                    -- kohort smart sedang akumulasi
  ORDER BY
    -- Tekanan lebih dulu: edge terukurnya paling tinggi (+2,45 pp).
    COALESCE(tp.tekanan, -99) DESC,
    a.smart_bn DESC
  LIMIT 40
`

const MARKET_SQL = `
  WITH latest AS (SELECT MAX(trading_date) AS d FROM market.daily_transactions)
  SELECT
    (SELECT d FROM latest)::VARCHAR                              AS trading_date,
    COUNT(*)::INTEGER                                            AS n,
    SUM(CASE WHEN change_percent > 0 THEN 1 ELSE 0 END)::INTEGER AS naik,
    ROUND(AVG(change_percent)::DOUBLE, 2)                        AS avg_chg
  FROM market.daily_transactions dt CROSS JOIN latest l
  WHERE dt.trading_date = l.d AND dt.value >= 1000000000
`

export async function GET() {
  try {
    const [signals, market] = await Promise.all([
      runQuery(SIGNAL_SQL, [], 900),
      runQuery(MARKET_SQL, [], 900),
    ])

    const m: any = market.rows[0] ?? {}
    const breadth = m.n ? Math.round((m.naik / m.n) * 100) : null

    return NextResponse.json({
      success: true,
      fromCache: signals.fromCache && market.fromCache,
      cacheStats: getCacheStats(),
      market: {
        tradingDate: m.trading_date ?? null,
        breadthPct: breadth,
        avgChangePct: m.avg_chg ?? null,
        regime: breadth === null ? 'unknown' : breadth >= 55 ? 'naik' : breadth <= 40 ? 'turun' : 'campuran',
      },
      // Supaya UI bisa menyatakan dasar klaimnya, bukan sekadar menampilkan skor.
      method: {
        window: '5 hari bursa · tape broker (FOREIGN + LOCAL_INST)',
        utama: 'tekanan broker = share tape × agresi terhadap VWAP',
        backtest: 'Jan–Jul 2026 · kuintil-5 tekanan: edge +2,45 pp (20h), satu-satunya kelompok dengan return 5h positif',
        pir: 'PIR mengikuti definisi BEI (perubahan harga / velocity float) — label risiko, bukan filter sinyal',
        caveat: 'Satu rezim pasar bearish. Edge relatif, bukan jaminan untung. Kode broker mewakili aliran order, bukan satu pelaku.',
      },
      data: signals.rows,
    })
  } catch (err: any) {
    console.error('[API bandar-summary error]:', err.message)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
