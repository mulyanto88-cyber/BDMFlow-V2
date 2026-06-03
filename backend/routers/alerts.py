from fastapi import APIRouter, Request, Query
from database import query
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/summary")
async def get_alerts_summary(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-summary")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = "SELECT * FROM market.vw_a_alert_summary ORDER BY highest_severity DESC, alert_rank_score DESC"
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/whale")
async def get_alerts_whale(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-whale")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_a_whale_alert
        WHERE severity IN ('CRITICAL','HIGH')
        ORDER BY whale_quality_score DESC
    """
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/stealth")
async def get_alerts_stealth(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-stealth")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_a_stealth_alert
        WHERE severity IN ('CRITICAL','HIGH','MEDIUM')
        ORDER BY stealth_score DESC
    """
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/insider")
async def get_alerts_insider(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-insider")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM main.vw_a_insider_alert
        WHERE severity IN ('CRITICAL','HIGH','MEDIUM')
        ORDER BY tx_count_7d DESC
    """
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/distribution")
async def get_alerts_distribution(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-distribution")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_a_distribution_alert
        WHERE severity IN ('HIGH','MEDIUM')
        ORDER BY composite_score ASC
    """
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/ksei")
async def get_alerts_ksei(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("alerts-ksei")
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM ksei.vw_a_ksei_new_entry
        WHERE severity IN ('CRITICAL','HIGH','MEDIUM')
        ORDER BY ksei_score DESC
    """
    rows = query(sql)
    set_cached(cache_key, rows, ttl=300)
    return rows
