from fastapi import APIRouter, Request, Query
from database import query, query_one
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api", tags=["extended"])


# ── FOREIGN FLOW ──

@router.get("/foreign-flow/top-inflow")
async def get_foreign_top_inflow(
    request: Request,
    window: str = Query("5d", regex="^(1d|5d|20d|60d)$"),
    limit: int = Query(20, ge=1, le=50),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ff-inflow", window, limit)
    cached = get_cached(cache_key)
    if cached:
        return cached

    col = f"net_foreign_{window}_miliar"
    rows = query(f"""
        SELECT stock_code, {col} AS net_flow, sector, composite_score, composite_tier,
               close, change_percent, return_5d, return_20d
        FROM market.vw_d_foreign_flow_history
        WHERE {col} > 0
        ORDER BY {col} DESC
        LIMIT $1
    """, (limit,))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/foreign-flow/top-outflow")
async def get_foreign_top_outflow(
    request: Request,
    window: str = Query("5d", regex="^(1d|5d|20d|60d)$"),
    limit: int = Query(15, ge=1, le=50),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ff-outflow", window, limit)
    cached = get_cached(cache_key)
    if cached:
        return cached

    col = f"net_foreign_{window}_miliar"
    rows = query(f"""
        SELECT stock_code, {col} AS net_flow, sector, composite_score, composite_tier,
               close, change_percent, return_5d, return_20d
        FROM market.vw_d_foreign_flow_history
        WHERE {col} < 0
        ORDER BY {col} ASC
        LIMIT $1
    """, (limit,))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/foreign-flow/reversals")
async def get_foreign_reversals(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ff-reversals")
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, reversal_type, net_foreign_5d_miliar, net_foreign_20d_miliar,
               composite_score, composite_tier, sector, close, change_percent, severity
        FROM market.vw_a_foreign_reversal_alert
        ORDER BY composite_score DESC
        LIMIT 30
    """)
    set_cached(cache_key, rows, ttl=300)
    return rows


# ── KSEI INSTITUTIONAL ──

@router.get("/ksei/top-accumulation")
async def get_ksei_top_accumulation(request: Request, limit: int = Query(20, ge=1, le=50)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ksei-accum", limit)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, sm_entry_type, signal_quality, sm_trend,
               smart_money_miliar, sm_3m_cumulative_miliar,
               smart_retail_divergence, ksei_score, composite_score, composite_tier,
               sector, group_name, close, return_20d
        FROM ksei.vw_c_ksei_ownership_change
        WHERE sm_entry_type IN ('CONSISTENT_3M','CONSISTENT_2M','NEW_ENTRY_ACCELERATING')
          AND ksei_score >= 8
        ORDER BY ksei_score DESC, composite_score DESC
        LIMIT $1
    """, (limit,))
    set_cached(cache_key, rows, ttl=900)
    return rows


@router.get("/ksei/divergence")
async def get_ksei_divergence(request: Request, limit: int = Query(20, ge=1, le=50)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ksei-divergence", limit)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, sm_entry_type, signal_quality,
               smart_money_miliar, retail_chg_miliar,
               smart_retail_divergence, ksei_score, composite_score,
               composite_tier, sector, close, return_20d
        FROM ksei.vw_c_ksei_ownership_change
        WHERE smart_retail_divergence = 'SMART_ACCUM_RETAIL_DISTRIB'
        ORDER BY ksei_score DESC
        LIMIT $1
    """, (limit,))
    set_cached(cache_key, rows, ttl=900)
    return rows


@router.get("/ksei/investor-breakdown")
async def get_ksei_investor_breakdown(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ksei-breakdown", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT * FROM ksei.vw_f_ksei_investor_breakdown
        WHERE Code = $1
        ORDER BY Date DESC
        LIMIT 12
    """, (stock_code,))
    set_cached(cache_key, rows, ttl=900)
    return rows


# ── INSIDER INTELLIGENCE ──

@router.get("/insider/feed")
async def get_insider_feed(
    request: Request,
    days: int = Query(30, ge=1, le=90),
    limit: int = Query(50, ge=1, le=100),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("insider-feed", days, limit)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, transaction_date, insider_name, role_label,
               action_type, pct_change, est_value_idr, conviction_tier,
               sector, group_name, days_ago
        FROM main.vw_f_insider_events
        WHERE days_ago <= $1
        ORDER BY transaction_date DESC, est_value_idr DESC
        LIMIT $2
    """, (days, limit))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/insider/clusters")
async def get_insider_clusters(request: Request, days: int = Query(60, ge=1, le=180)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("insider-clusters", days)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, cluster_start_date, cluster_end_date,
               buyer_count, seller_count, unique_roles,
               cluster_type, est_total_value_miliar
        FROM main.vw_s_insider_cluster
        WHERE cluster_end_date >= CURRENT_DATE - $1
        ORDER BY cluster_end_date DESC, buyer_count DESC
    """, (days,))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/insider/leaderboard")
async def get_insider_leaderboard(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("insider-leaderboard")
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT stock_code, conviction_tier, direction_30d,
               buy_count_30d, sell_count_30d,
               pengendali_buy_30d, is_cluster_buy,
               buy_value_7d_miliar, tx_count_7d, last_tx_date,
               composite_score, composite_tier, sector, close, return_20d
        FROM main.vw_s_insider_buying
        WHERE buy_count_30d > 0
        ORDER BY
            CASE conviction_tier WHEN 'HIGH' THEN 0 WHEN 'MEDIUM' THEN 1 ELSE 2 END,
            buy_value_7d_miliar DESC
        LIMIT 30
    """)
    set_cached(cache_key, rows, ttl=300)
    return rows
