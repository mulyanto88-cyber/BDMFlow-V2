export const TIER_COLORS: Record<string, string> = {
  STRONG_BUY: "#16a34a",
  BUY: "#22c55e",
  ACCUMULATE: "#84cc16",
  WATCH: "#eab308",
  NEUTRAL: "#6b7280",
  AVOID: "#ef4444",
};

export const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#6b7280",
};

export const ALERT_PRIORITY: Record<string, number> = {
  WHALE: 8,
  STEALTH: 7,
  INSIDER: 6,
  DISTRIBUTION: 5,
  REVERSAL: 4,
  PRIME_LEAD: 9,
  VOLUME_SPIKE: 3,
  KSEI_ENTRY: 8,
  SCORE_BREAKOUT: 10,
};

export const PAGE_SIZE = 25;

export const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
