export interface CompositeStock {
  rank_overall: number;
  stock_code: string;
  composite_score: number;
  composite_tier: string;
  daily_trigger_score: number;
  monthly_confirm_score: number;
  foreign_score: number;
  broker_score: number;
  whale_score: number;
  stealth_quality: string | null;
  foreign_flow_direction: string | null;
  sector: string;
  group_name: string;
  close: number;
  change_percent: number;
  return_5d: number;
  return_20d: number;
}

export interface DailyFlowStock {
  stock_code: string;
  whale_verdict: string | null;
  stealth_quality: string | null;
  net_foreign_miliar: number;
  composite_score: number;
  composite_tier: string;
  sector: string;
  close: number;
  change_percent: number;
}

export interface BrokerIntel {
  stock_code: string;
  prime_net_5d: number;
  prime_buyers_5d: number;
  foreign_net_5d: number;
  inst_net_5d: number;
  convergence_level: string | null;
  composite_score: number;
  sector: string;
  close: number;
}

export interface KseiOwnership {
  stock_code: string;
  sm_entry_type: string | null;
  smart_money_miliar: number;
  sm_3m_cumulative_miliar: number;
  ksei_score: number;
  composite_score: number;
  composite_tier: string;
  sector: string;
  close: number;
  return_20d: number;
}

export interface InsiderStock {
  stock_code: string;
  conviction_tier: string | null;
  is_cluster_buy: boolean;
  buy_count_30d: number;
  buy_value_7d_miliar: number;
  last_tx_date: string;
  composite_score: number;
  composite_tier: string;
  sector: string;
  close: number;
}

export interface MarketPulse {
  latest_trading_date: string | null;
  market_regime: string | null;
  foreign_stance: string | null;
  breadth_score: number | null;
  market_timing_signal: string | null;
  net_foreign_today_miliar: number | null;
  whale_events_today: number | null;
  total_value_triliun: number | null;
  total_stocks: number | null;
  strong_buy_count: number | null;
  buy_count: number | null;
  accumulate_count: number | null;
  watch_count: number | null;
  neutral_count: number | null;
  avoid_count: number | null;
  breadth_5d: number | null;
  breadth_20d: number | null;
  foreign_5d_total: number | null;
  foreign_20d_total: number | null;
  return_5d_avg: number | null;
  return_20d_avg: number | null;
  regime_changed_today: boolean | null;
  is_accumulation_day: boolean | null;
  is_risk_off_day: boolean | null;
}

export interface SectorRotation {
  sector: string;
  rotation_signal: string;
  foreign_5d: number;
  foreign_20d: number;
  avg_composite_score: number;
  top_stock: string;
  leadership_status: string;
}

export interface ScreenerStock {
  stock_code: string;
  composite_score: number;
  composite_tier: string;
  daily_trigger_score: number;
  sector: string;
  group_name: string;
  close: number;
  change_percent: number;
  return_5d: number;
  return_20d: number;
  foreign_score: number;
  broker_score: number;
  ksei_score: number;
  whale_score: number;
  stealth_quality: string | null;
}

export interface DeepDiveSummary {
  stock_code: string;
  composite_score: number;
  composite_tier: string;
  foreign_score: number;
  broker_score: number;
  whale_score: number;
  price_score: number | null;
  ksei_score: number;
  insider_score: number;
  stealth_quality: string | null;
  phase: string | null;
  sector: string;
  group_name: string;
  close: number;
  change_percent: number;
  return_5d: number;
  return_20d: number;
  return_60d: number;
}

export interface DeepDivePrice {
  stock_code: string;
  trading_date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
  net_foreign_1d: number;
  signal_label: string | null;
  composite_score: number;
}

export interface AlertSummary {
  stock_code: string;
  alert_count: number;
  highest_severity: string;
  active_alerts: string;
  top_notification: string;
  composite_score: number;
  composite_tier: string;
  sector: string;
  close: number;
  change_percent: number;
  badge_color: string;
  alert_rank_score: number;
}

export interface WhaleEvent {
  stock_code: string;
  trading_date: string;
  whale_verdict: string;
  whale_quality_score: number;
  aov_ratio_ma20: number;
  net_foreign_miliar: number;
  severity: string;
  notification_text: string;
  composite_score: number;
  composite_tier: string;
  sector: string;
  close: number;
}

export interface GroupMomentum {
  group_name: string;
  avg_composite_score: number;
  score_change_5d: number;
  foreign_net_5d_miliar: number;
  rotation_signal: string;
  stock_count: number;
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}
