-- ============================================================
-- BDMFlow V2 — Materialized Tables (Phase 1)
-- Run ONCE in MotherDuck UI. Creates tb_ mirrors of expensive views.
-- After running this, execute sql/refresh_materialized.sql nightly.
-- ============================================================

-- Priority 1: stock-detail route reads this 5× per page load (0.116s × 5)
CREATE TABLE IF NOT EXISTS market.tb_stock_detail AS
  SELECT * FROM market.vw_stock_detail;

-- Priority 2: broker-tracker reads broker_activity (3.35M rows) per query
CREATE TABLE IF NOT EXISTS main.tb_broker_daily AS
  SELECT * FROM main.vw_broker_daily;

CREATE TABLE IF NOT EXISTS main.tb_broker_market_breadth AS
  SELECT * FROM main.vw_broker_market_breadth;

-- Priority 3: screener main page — deepest plan, joins 3.35M broker_activity
CREATE TABLE IF NOT EXISTS market.tb_screener_allinone AS
  SELECT * FROM market.vw_screener_allinone;

-- Priority 4: insider activity — WINDOW LAG over 18K rows
CREATE TABLE IF NOT EXISTS main.tb_insider_activity_feed AS
  SELECT * FROM main.vw_insider_activity_feed;

CREATE TABLE IF NOT EXISTS main.tb_insider_alert_feed AS
  SELECT * FROM main.vw_insider_alert_feed;

CREATE TABLE IF NOT EXISTS main.tb_insider_conviction_score AS
  SELECT * FROM main.vw_insider_conviction_score;

CREATE TABLE IF NOT EXISTS main.tb_insider_with_market AS
  SELECT * FROM main.vw_insider_with_market;

CREATE TABLE IF NOT EXISTS main.tb_insider_latest_position AS
  SELECT * FROM main.vw_insider_latest_position;

-- Priority 5: stealth accumulation — 4× calls across dashboard + broker-tracker
CREATE TABLE IF NOT EXISTS ksei.tb_stealth_accumulation AS
  SELECT * FROM ksei.vw_stealth_accumulation;

-- Medium priority: called 3× each, small source tables
CREATE TABLE IF NOT EXISTS ksei.tb_ksei_inst_positioning AS
  SELECT * FROM ksei.vw_ksei_inst_positioning;

CREATE TABLE IF NOT EXISTS ksei.tb_ksei_individual_changes AS
  SELECT * FROM ksei.vw_ksei_individual_changes;

CREATE TABLE IF NOT EXISTS ksei.tb_insider_screener AS
  SELECT * FROM ksei.vw_insider_screener;

CREATE TABLE IF NOT EXISTS ksei.tb_whale_timing AS
  SELECT * FROM ksei.vw_whale_timing;

CREATE TABLE IF NOT EXISTS ksei.tb_top_investors AS
  SELECT * FROM ksei.vw_top_investors;

CREATE TABLE IF NOT EXISTS ksei.tb_ownership_1pct_latest AS
  SELECT * FROM ksei.vw_ownership_1pct_latest;

-- Lower priority: single-call views with light compute
CREATE TABLE IF NOT EXISTS market.tb_stock_multi_signal AS
  SELECT * FROM market.vw_stock_multi_signal;

CREATE TABLE IF NOT EXISTS market.tb_whale_activity AS
  SELECT * FROM market.vw_whale_activity;

CREATE TABLE IF NOT EXISTS market.tb_stock_screener AS
  SELECT * FROM market.vw_stock_screener;

CREATE TABLE IF NOT EXISTS market.tb_tactical_momentum_smart_money AS
  SELECT * FROM market.vw_tactical_momentum_smart_money;

CREATE TABLE IF NOT EXISTS market.tb_sector_analytics AS
  SELECT * FROM market.vw_sector_analytics;

CREATE TABLE IF NOT EXISTS market.tb_group_leader_laggard AS
  SELECT * FROM market.vw_group_leader_laggard;

CREATE TABLE IF NOT EXISTS market.tb_group_broker_stance AS
  SELECT * FROM market.vw_group_broker_stance;

CREATE TABLE IF NOT EXISTS market.tb_group_multi_period_perf AS
  SELECT * FROM market.vw_group_multi_period_perf;

CREATE TABLE IF NOT EXISTS market.tb_group_phase_composite AS
  SELECT * FROM market.vw_group_phase_composite;

-- Bonus: used in insider route but not in priority list
CREATE TABLE IF NOT EXISTS main.tb_insider_net_flow_by_stock AS
  SELECT * FROM main.vw_insider_net_flow_by_stock;
