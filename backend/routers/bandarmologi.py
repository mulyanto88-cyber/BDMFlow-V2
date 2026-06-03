from fastapi import APIRouter, Request, Query
from database import query, VIEW_MAP
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api", tags=["bandarmologi"])


@router.get("/bandarmologi/prime-brokers")
async def get_prime_brokers(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("bandar-prime")
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT
            stock_code,
            prime_net_5d,
            prime_net_20d,
            prime_buyers_5d,
            prime_brokers_active,
            prime_lead_signal,
            prime_conviction,
            composite_score,
            composite_tier,
            sector,
            close,
            return_5d
        FROM market.vw_d_broker_intel_tab
        WHERE prime_is_buyer_5d = true
           OR prime_lead_signal IN ('PRIME_LEADING','ALIGNED_BUY')
        ORDER BY prime_net_5d DESC
        LIMIT 40
    """)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/bandarmologi/convergence")
async def get_broker_convergence(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("bandar-convergence")
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT
            stock_code,
            foreign_net_5d,
            inst_net_5d,
            convergence_level,
            foreign_buyers_count,
            inst_buyers_count,
            composite_score,
            composite_tier,
            sector,
            close,
            return_5d
        FROM market.vw_d_broker_intel_tab
        WHERE convergence_level IN ('STRONG','MODERATE')
        ORDER BY foreign_buyers_count DESC, composite_score DESC
        LIMIT 40
    """)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/bandarmologi/leaderboard")
async def get_bandar_leaderboard(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("bandar-leaderboard")
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT
            stock_code,
            composite_score,
            composite_tier,
            broker_score,
            foreign_score,
            whale_score,
            prime_net_5d,
            convergence_level,
            stealth_quality,
            sector,
            group_name,
            close,
            change_percent,
            return_5d,
            return_20d
        FROM market.vw_d_broker_intel_tab
        WHERE composite_score >= 40
        ORDER BY broker_score DESC, composite_score DESC
        LIMIT 30
    """)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/bandarmologi/broker-detail")
async def get_broker_detail(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("bandar-detail", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    rows = query("""
        SELECT
            broker_name,
            broker_code,
            category,
            origin,
            is_prime,
            net_1d_miliar,
            net_5d_miliar,
            net_20d_miliar,
            net_30d_miliar,
            action,
            rank_by_5d_net
        FROM market.vw_d_top_broker_net
        WHERE stock_code = $1
        ORDER BY rank_by_5d_net ASC
        LIMIT 30
    """, (stock_code,))
    set_cached(cache_key, rows, ttl=300)
    return rows
