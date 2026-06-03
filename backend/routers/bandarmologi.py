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

    # SELECT * defensive — frontend picks columns it needs
    rows = query("""
        SELECT * FROM market.vw_d_broker_intel_tab
        WHERE prime_lead_signal IN ('PRIME_LEADING','ALIGNED_BUY')
        ORDER BY composite_score DESC
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

    # SELECT * defensive — frontend picks columns it needs
    rows = query("""
        SELECT * FROM market.vw_d_broker_intel_tab
        WHERE foreign_convergence_level IN ('STRONG','MODERATE')
        ORDER BY composite_score DESC
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

    # SELECT * defensive — frontend picks columns it needs
    rows = query("""
        SELECT * FROM market.vw_d_broker_intel_tab
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
        SELECT * FROM market.vw_d_top_broker_net
        WHERE stock_code = $1
        ORDER BY rank_by_5d_net ASC
        LIMIT 30
    """, (stock_code,))
    set_cached(cache_key, rows, ttl=300)
    return rows
