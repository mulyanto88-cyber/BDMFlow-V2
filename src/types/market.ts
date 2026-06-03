// ─── Base ──────────────────────────────────────────────────────────────────
export interface StockRow {
  stock_code: string; sector: string | null; company_name?: string | null
  close: number; change_percent: number; value?: number; volume?: number
}
export interface SmartMoneyRow {
  stock_code: string; sector: string; close: number; change_percent: number
  smart_money_score: number; signal: string; net_foreign_1d: number
  net_foreign_5d: number; broker_net_5d: number; tactical_signal: string
  foreign_30d: number; broker_net: number; is_stealth?: boolean
  whale_signal?: boolean; big_player_anomaly?: boolean
}
export interface TacticalRow {
  stock_code: string; sector?: string; close: number; change_percent: number
  net_foreign_1d: number; net_foreign_5d: number; broker_net_5d: number
  tactical_signal: string
}
export interface StrategicRow {
  stock_code: string; total_inst_pct: number; prev_inst_pct: number
  mom_change_pct: number; strategic_signal: string
  latest_snapshot?: string; prev_snapshot?: string
}
export interface SectorRow {
  sector: string; stock_count: number; avg_change_pct: number
  total_value: number; total_volume: number; foreign_flow: number
  foreign_30d: number; avg_aov: number; max_aov: number
  aov_spike_count: number; whale_count: number; anomaly_count: number
  above_vwma_count: number; volume_spike_count: number
  gainers: number; losers: number; momentum_score: number
  signal: string; flow_intensity: string
  top_stock_code: string; top_stock_price: number; top_stock_change: number
}
export interface BrokerRow {
  broker_code: string; broker_name: string; buy_val: number
  sell_val: number; net_val: number; buy_consistency_pct?: number | null
  net_buy_days?: number | null; total_days?: number | null
}
export interface MarketBreadth {
  date: string; totalForeign: number; totalValue: number; totalVolume: number
  up: number; down: number; unchanged: number; whaleCount: number; total: number
}
export interface InsiderAlert {
  share_code: string; investor_name: string; investor_type?: string
  action: string; pct_point_change: number; alert_level: string
  prev_percentage?: number; curr_percentage?: number
}
export interface HighConvictionStock {
  stock_code: string; sector: string; price: number; price_chg_pct: number
  conviction_score: number; institutional_flow: number; is_stealth: boolean
}
export interface BrokerMover {
  nama_broker: string; saham_count: number; total_buy_value: number
  total_sell_value: number; total_net_value: number
}
export interface KseiMover {
  share_code: string; investor_name: string; scripless_diff: number
}
export interface BigPlayerActivity {
  brokers: BrokerMover[]; insiders: InsiderAlert[]; kseiAlerts: KseiMover[]
}
export interface StealthStock {
  stock_code: string; Price: number; CP_Flow_Miliar: number
  Price_Chg_Pct: number; Signal: string
}
export type MarketSentiment = 'ACCUMULATION' | 'DISTRIBUTION' | 'NEUTRAL'

// ─── Morning Brief ─────────────────────────────────────────────────────────
export interface MorningBriefData {
  breadth: MarketBreadth | null
  topRadar: RadarStock[]
  groupRotation: GroupRotation[]
  alertFeed: AlertItem[]
  stealth: StealthStock[]
}
export interface RadarStock {
  stock_code: string; sector: string; group_name: string; close: number
  change_percent: number; radar_score: number; composite_signal: string
  foreign_broker_net_7d: number; local_inst_net_7d: number
  ksei_net_smart_miliar: number; whale_signal: boolean
}
export interface GroupRotation {
  group_name: string; composite_score: number; market_phase: string
  group_action_signal: string; perf_1d: number; total_stocks: number
  smart_money_trend: string; broker_consensus: string
}
export interface AlertItem {
  type: 'insider' | 'broker' | 'ksei'
  stock_code: string; description: string; level: 'HIGH' | 'MEDIUM' | 'LOW'
  timestamp: string
}

// ─── Volume & AOV ──────────────────────────────────────────────────────────
export interface VolumeAovRow {
  stock_code: string; sector: string; close: number; change_percent: number
  volume: number; ma20_volume: number; volume_ratio: number
  aov_ratio_ma20: number; net_foreign_value: number
  whale_signal: boolean; spike_type: string; confirmation_score: number
  spike_7d: number; spike_30d: number; daily_value: number
}

// ─── Broker Flow ───────────────────────────────────────────────────────────
export interface BrokerFlowStock {
  stock_code: string; sector: string; close: number; change_percent: number
  foreign_broker_net_1d: number; foreign_broker_net_7d: number
  local_inst_net_1d: number; local_inst_net_7d: number
  retail_net_1d: number; retail_net_7d: number
  prime_broker_net_7d: number; foreign_brokers_buying_7d: number
  flow_signal: string; daily_value: number
}
export interface BrokerProfile {
  broker_code: string; broker_name: string; category: string
  is_prime: boolean; net_value: number; buy_value: number; sell_value: number
  active_days: number; total_stocks: number; buy_ratio_pct: number
  top_stocks: string
}

// ─── KSEI Monthly ──────────────────────────────────────────────────────────
export interface KseiMonthlyRow {
  stock_code: string; sector: string; group_name: string
  latest_month: string; latest_price: number
  m0_smart_miliar: number; m1_smart_miliar: number | null; m2_smart_miliar: number | null
  m0_retail_miliar: number; cumulative_3m_smart: number
  months_positive: number; latest_top_buyer: string | null
  smart_money_trend: string; divergence_signal: string
}
export interface KseiInstitutionDetail {
  stock_code: string; cp_flow: number; pf_flow: number; ib_flow: number
  foreign_cp_flow: number; foreign_pf_flow: number; foreign_ib_flow: number
  retail_flow: number; total_smart: number
}

// ─── Stock Command Center ──────────────────────────────────────────────────
export interface StockCommandData {
  latest: StockLatest | null
  chart: ChartPoint[]
  brokerDna: BrokerDnaData | null
  kseiMonthly: KseiMonthlyDetail | null
  insider: InsiderData | null
  ownership: OwnershipData | null
  conviction: ConvictionData | null
}
export interface StockLatest {
  stock_code: string; trading_date: string; close: number; open_price: number
  high: number; low: number; change_percent: number; volume: number; value: number
  net_foreign_value: number; vwma_20d: number; aov_ratio_ma20: number
  whale_signal: boolean; big_player_anomaly: boolean; signal: string
  sector: string; group_name: string; free_float: number
}
export interface ChartPoint {
  trading_date: string; open_price: number; high: number; low: number
  close: number; volume: number; net_foreign_value: number
  vwma_20d: number; aov_ratio_ma20: number; whale_signal: boolean
}
export interface BrokerDnaData {
  rolling: {
    foreign_broker_net_1d: number; foreign_broker_net_7d: number; foreign_broker_net_30d: number
    prime_broker_net_7d: number; local_inst_net_1d: number; local_inst_net_7d: number
    local_inst_net_30d: number; retail_net_1d: number; retail_net_7d: number
    foreign_brokers_buying_7d: number; local_inst_brokers_buying_7d: number
  } | null
  topBuyers: BrokerStockEntry[]
  topSellers: BrokerStockEntry[]
}
export interface BrokerStockEntry {
  broker_code: string; broker_name: string; category: string
  is_prime: boolean; net_miliar: number; buy_miliar: number; sell_miliar: number
}
export interface KseiMonthlyDetail {
  trend: KseiMonthPoint[]
  composition: KseiComposition | null
}
export interface KseiMonthPoint {
  Date: string; net_smart_miliar: number; retail_miliar: number
  local_smart_miliar: number; foreign_smart_miliar: number
  cp_flow: number; pf_flow: number; ib_flow: number; Price: number
}
export interface KseiComposition {
  Local_CP_Pct: number; Foreign_CP_Pct: number; Local_ID_Pct: number
  Local_Pct: number; Foreign_Pct: number
}
export interface InsiderData {
  convictionScore: number; insiderSignal: string; freshBuy: boolean
  freshSell: boolean; transactions: InsiderTransaction[]
}
export interface InsiderTransaction {
  transaction_date: string; insider_name: string; action_type: string
  insider_type: string; shares_change: number; pct_change: number
  pct_current: number; price_formatted: number; est_value_miliar: number | null
  is_pengendali: boolean; is_komisaris: boolean; is_direksi: boolean
}
export interface OwnershipData {
  holders: OwnershipHolder[]
  whaleTiming: WhaleTiming | null
}
export interface OwnershipHolder {
  investor_name: string; investor_type: string; local_foreign: string
  nationality: string; percentage: number; total_holding_shares: number
}
export interface WhaleTiming {
  investor_name: string; first_seen_date: string; est_entry_price: number
  current_price: number; return_since_entry: number | null
  position_trend: string; whale_verdict: string; holding_days: number
}
export interface ConvictionData {
  score: number; label: string; reasons: string[]
  broker_signal: string; ksei_signal: string; insider_signal: string
  market_signal: string
}
