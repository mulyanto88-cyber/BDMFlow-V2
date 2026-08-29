-- ============================================================
-- BDMFlow V2 — Nightly Materialized Table Refresh (v2)
-- 
-- Run via refresh_materialized.yml ETL workflow.
-- Uses CREATE OR REPLACE TABLE (atomic in DuckDB).
-- --
-- PASTE the corresponding Python block into:
--   .github/workflows/refresh_materialized.yml
--   right BEFORE the "# ── Freshness manifest" section.
-- ============================================================

          # ═══════════════════════════════════════════════════════════════
          # Phase 2: vw_ → tb_ snapshot (27 tables) — added 2026-07-26
          # Eliminates per-request view computation. Benchmark: 3-5s saving
          # per heavy session (stock-detail, broker-tracker, screener).
          # ═══════════════════════════════════════════════════════════════

          # Priority 1: stock-detail route reads these 5× per page load
          refresh('market.tb_stock_detail',       'SELECT * FROM market.vw_stock_detail')
          refresh('market.tb_stock_multi_signal', 'SELECT * FROM market.vw_stock_multi_signal')
          refresh('market.tb_whale_activity',     'SELECT * FROM market.vw_whale_activity')

          # Priority 2: broker-tracker — broker_activity 3.35M rows scanned per query
          refresh('main.tb_broker_daily',           'SELECT * FROM main.vw_broker_daily')
          refresh('main.tb_broker_market_breadth',  'SELECT * FROM main.vw_broker_market_breadth')

          # Priority 3: screener main page — deepest plan
          refresh('market.tb_screener_allinone', 'SELECT * FROM market.vw_screener_allinone')
          refresh('market.tb_stock_screener',    'SELECT * FROM market.vw_stock_screener')

          # Priority 4: insider — WINDOW LAG + multiple calls
          refresh('main.tb_insider_activity_feed',    'SELECT * FROM main.vw_insider_activity_feed')
          refresh('main.tb_insider_alert_feed',       'SELECT * FROM main.vw_insider_alert_feed')
          refresh('main.tb_insider_conviction_score',  'SELECT * FROM main.vw_insider_conviction_score')
          refresh('main.tb_insider_with_market',      'SELECT * FROM main.vw_insider_with_market')
          refresh('main.tb_insider_latest_position',  'SELECT * FROM main.vw_insider_latest_position')
          refresh('main.tb_insider_net_flow_by_stock','SELECT * FROM main.vw_insider_net_flow_by_stock')

          # Priority 5: KSEI — stealth accumulation called 4× across routes
          refresh('ksei.tb_stealth_accumulation',     'SELECT * FROM ksei.vw_stealth_accumulation')
          refresh('ksei.tb_ksei_inst_positioning',    'SELECT * FROM ksei.vw_ksei_inst_positioning')
          refresh('ksei.tb_ksei_individual_changes',  'SELECT * FROM ksei.vw_ksei_individual_changes')
          refresh('ksei.tb_insider_screener',         'SELECT * FROM ksei.vw_insider_screener')
          refresh('ksei.tb_whale_timing',             'SELECT * FROM ksei.vw_whale_timing')
          refresh('ksei.tb_top_investors',            'SELECT * FROM ksei.vw_top_investors')
          refresh('ksei.tb_ownership_1pct_latest',    'SELECT * FROM ksei.vw_ownership_1pct_latest')

          # Lower priority: single-call views
          refresh('market.tb_tactical_momentum_smart_money', 'SELECT * FROM market.vw_tactical_momentum_smart_money')
          refresh('market.tb_sector_analytics',              'SELECT * FROM market.vw_sector_analytics')
          refresh('market.tb_group_leader_laggard',          'SELECT * FROM market.vw_group_leader_laggard')
          refresh('market.tb_group_broker_stance',           'SELECT * FROM market.vw_group_broker_stance')
          refresh('market.tb_group_multi_period_perf',       'SELECT * FROM market.vw_group_multi_period_perf')
          refresh('market.tb_group_phase_composite',         'SELECT * FROM market.vw_group_phase_composite')
