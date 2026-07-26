// /api/alerts/summary — signal feed for the ActionCenter widget.
//
// Previously read market.vw_a_alert_summary, a view that fanned out to six
// per-alert views and measured 13.2s per call. It was also what timed out
// `next build` (static generation of this route exceeded the 60s budget).
//
// The same signals already sit in market.tb_radar, refreshed nightly by the ETL,
// so the alert shape is derived from that instead: ~600ms, no view fan-out.
// The response shape is unchanged, so ActionCenter needs no edits.
import { NextResponse } from 'next/server'
import { run } from '@/lib/db'

// Data is T+1 → revalidate every 30 min, matching the edge cache in next.config.js.
// Not force-dynamic: that sends no-store and defeats that cache.
export const revalidate = 1800

export async function GET() {
  try {
    const data = await run(`
      WITH flagged AS (
        SELECT
          stock_code,
          sector,
          composite_signal,
          radar_score,
          -- Each flag becomes a named alert; concat_ws drops the NULLs.
          CASE WHEN whale_signal            THEN 'WHALE'    END AS a_whale,
          CASE WHEN big_player_anomaly      THEN 'ANOMALY'  END AS a_anomaly,
          CASE WHEN fresh_insider_buy       THEN 'INSIDER'  END AS a_insider,
          CASE WHEN ksei_net_smart_miliar > 0 THEN 'KSEI'   END AS a_ksei,
          CASE WHEN foreign_broker_net_7d > 0 THEN 'FOREIGN' END AS a_foreign,
          CASE WHEN aov_ratio_ma20 >= 1.5   THEN 'AOV'      END AS a_aov
        FROM market.tb_radar
        WHERE warning_flag IS NULL
          -- An unadjusted corporate action makes this row's price signals fiction.
          AND COALESCE(is_split_suspect, FALSE) = FALSE
          AND COALESCE(is_reverse_suspect, FALSE) = FALSE
      )
      SELECT
        stock_code,
        sector,
        concat_ws(', ', a_whale, a_anomaly, a_insider, a_ksei, a_foreign, a_aov) AS active_alerts,
        ( CASE WHEN a_whale   IS NULL THEN 0 ELSE 1 END
        + CASE WHEN a_anomaly IS NULL THEN 0 ELSE 1 END
        + CASE WHEN a_insider IS NULL THEN 0 ELSE 1 END
        + CASE WHEN a_ksei    IS NULL THEN 0 ELSE 1 END
        + CASE WHEN a_foreign IS NULL THEN 0 ELSE 1 END
        + CASE WHEN a_aov     IS NULL THEN 0 ELSE 1 END
        )::INTEGER AS alert_count,
        CASE
          WHEN radar_score >= 70 THEN 'CRITICAL'
          WHEN radar_score >= 55 THEN 'HIGH'
          WHEN radar_score >= 40 THEN 'MEDIUM'
          ELSE 'LOW'
        END AS highest_severity,
        composite_signal AS top_notification,
        radar_score::INTEGER AS alert_rank_score
      FROM flagged
      WHERE concat_ws(', ', a_whale, a_anomaly, a_insider, a_ksei, a_foreign, a_aov) <> ''
      ORDER BY radar_score DESC
      LIMIT 30
    `)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[alerts/summary]', err.message)
    return NextResponse.json({ error: 'Gagal memuat sinyal.' }, { status: 500 })
  }
}
