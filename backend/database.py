import duckdb
import threading
import logging
from config import MOTHERDUCK_TOKEN, MOTHERDUCK_DATABASE

logger = logging.getLogger(__name__)

# Thread-safe connection management
_conn: duckdb.DuckDBPyConnection | None = None
_lock = threading.Lock()


def _build_connection() -> duckdb.DuckDBPyConnection:
    token = MOTHERDUCK_TOKEN
    if not token:
        raise RuntimeError("MOTHERDUCK_TOKEN environment variable is not set")
    db = MOTHERDUCK_DATABASE or "my_db"
    conn = duckdb.connect(f"md:{db}?motherduck_token={token}")
    logger.info(f"MotherDuck connection established to {db}")
    return conn


def get_connection() -> duckdb.DuckDBPyConnection:
    """Thread-safe singleton connection with auto-reconnect."""
    global _conn
    # Fast path: connection exists and healthy
    if _conn is not None:
        try:
            _conn.execute("SELECT 1")
            return _conn
        except Exception:
            # Connection stale — fall through to reconnect
            logger.warning("MotherDuck connection stale, reconnecting...")
            _conn = None

    # Slow path: need to create/recreate connection
    with _lock:
        # Double-check after acquiring lock
        if _conn is None:
            _conn = _build_connection()
    return _conn


def query(sql: str, params: tuple = ()) -> list[dict]:
    """Execute SQL and return list of dicts. Auto-retries once on connection error."""
    try:
        conn = get_connection()
        result = conn.execute(sql, params)
        columns = [desc[0] for desc in result.description]
        return [dict(zip(columns, row)) for row in result.fetchall()]
    except duckdb.IOException as e:
        # Connection issue — force reconnect and retry once
        global _conn
        logger.warning(f"Query failed with IOException, retrying: {e}")
        _conn = None
        conn = get_connection()
        result = conn.execute(sql, params)
        columns = [desc[0] for desc in result.description]
        return [dict(zip(columns, row)) for row in result.fetchall()]


def query_one(sql: str, params: tuple = ()) -> dict | None:
    rows = query(sql, params)
    return rows[0] if rows else None


VIEW_MAP = {
    "composite":          "market.vw_d_composite_tab",
    "daily-flow":         "market.vw_d_daily_flow_tab",
    "broker-intel":       "market.vw_d_broker_intel_tab",
    "ksei":               "ksei.vw_d_ksei_tab",
    "insider":            "main.vw_d_insider_tab",
    "market-pulse":       "market.vw_d_market_pulse_tab",
    "sector-rotation":    "market.vw_d_sector_rotation_tab",
    "group-momentum":     "market.vw_d_group_momentum_tab",
    "screener":           "market.vw_d_screener_tab",
    "deepdive-price":     "market.vw_d_deepdive_price",
    "deepdive-broker":    "market.vw_d_deepdive_broker",
    "deepdive-ksei":      "ksei.vw_d_deepdive_ksei",
    "deepdive-insider":   "main.vw_d_deepdive_insider",
    "deepdive-summary":   "market.vw_d_deepdive_summary",
    "whale-feed":         "market.vw_d_whale_feed",
    "distribution":       "market.vw_d_distribution_feed",
    "breadth-history":    "market.vw_d_breadth_history",
    "foreign-history":    "market.vw_d_foreign_flow_history",
    "broker-map":         "market.vw_d_top_broker_net",
    "watchlist":          "market.vw_d_watchlist_context",
    "alerts-summary":     "market.vw_a_alert_summary",
    "alerts-whale":       "market.vw_a_whale_alert",
    "alerts-stealth":     "market.vw_a_stealth_alert",
    "alerts-insider":     "main.vw_a_insider_alert",
    "alerts-distribution":"market.vw_a_distribution_alert",
    "alerts-ksei":        "ksei.vw_a_ksei_new_entry",
}

# Whitelist of safe column names for ORDER BY
# (prevents SQL injection since ORDER BY cannot be parameterized)
SAFE_ORDER_COLUMNS = {
    "composite_score", "daily_trigger_score", "monthly_confirm_score",
    "foreign_score", "broker_score", "whale_score", "ksei_score",
    "rank_overall", "rank_in_sector", "stealth_score", "ksei_rank",
    "trading_date", "snapshot_date", "stock_code", "sector",
    "whale_quality_score", "alert_rank_score", "net_foreign_20d_miliar",
    "return_20d", "return_5d", "change_percent", "volume", "value",
    "avg_composite_score", "avg_score", "stock_count",
}


def query_endpoint(
    endpoint: str,
    where: str | None = None,
    order_by: str | None = None,
    limit: int = 50,
    offset: int = 0,
    stock_code: str | None = None,
    extra_filters: dict | None = None,
) -> dict:
    view = VIEW_MAP.get(endpoint)
    if not view:
        raise ValueError(f"No view mapped for endpoint: {endpoint}")

    conditions = []
    params = []

    if stock_code:
        # Validate stock_code format (uppercase letters + numbers only)
        if not stock_code.replace("-", "").isalnum():
            raise ValueError(f"Invalid stock_code format: {stock_code}")
        conditions.append("stock_code = ?")   # DuckDB uses ? not $1
        params.append(stock_code.upper())

    if where:
        # NOTE: 'where' must only be set from internal router code,
        # never from raw user input — no parameterization here
        conditions.append(f"({where})")

    if extra_filters:
        for col, val in extra_filters.items():
            # Whitelist column names to prevent injection
            if not col.replace("_", "").isalnum():
                raise ValueError(f"Invalid column name in extra_filters: {col}")
            conditions.append(f"{col} = ?")   # DuckDB uses ? not $1
            params.append(val)

    # Validate order_by against whitelist — supports comma-separated multi-column
    safe_order = None
    if order_by:
        safe_parts = []
        for part in order_by.split(","):
            col = part.replace(" DESC", "").replace(" ASC", "").strip()
            if col in SAFE_ORDER_COLUMNS:
                safe_parts.append(part.strip())
            else:
                logger.warning(f"Rejected unsafe order_by column: {col}")
        safe_order = ", ".join(safe_parts) if safe_parts else None

    where_clause  = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order_clause  = f"ORDER BY {safe_order}" if safe_order else ""
    limit_clause  = f"LIMIT {min(limit, 500)}"   # hard cap at 500
    offset_clause = f"OFFSET {max(offset, 0)}"

    count_sql = f"SELECT COUNT(*) AS total FROM {view} {where_clause}"
    data_sql  = (
        f"SELECT * FROM {view} "
        f"{where_clause} {order_clause} {limit_clause} {offset_clause}"
    )

    total_row = query(count_sql, tuple(params))
    total     = total_row[0]["total"] if total_row else 0
    data      = query(data_sql,  tuple(params))

    return {"data": data, "total": total}
