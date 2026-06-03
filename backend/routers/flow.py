from fastapi import APIRouter, Request, Query
from database import query_endpoint, query as raw_query
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api", tags=["flow"])


@router.get("/daily-flow")
async def get_daily_flow(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("daily-flow", page, page_size)
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("daily-flow", order_by="composite_score DESC", limit=page_size, offset=(page - 1) * page_size)
    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response


@router.get("/broker-intel")
async def get_broker_intel(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("broker-intel", page, page_size)
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("broker-intel", order_by="composite_score DESC", limit=page_size, offset=(page - 1) * page_size)
    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response


@router.get("/ksei")
async def get_ksei(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("ksei", page, page_size)
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("ksei", order_by="ksei_score DESC, composite_score DESC", limit=page_size, offset=(page - 1) * page_size)
    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response


@router.get("/insider")
async def get_insider(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("insider", page, page_size)
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("insider", order_by="composite_score DESC", limit=page_size, offset=(page - 1) * page_size)
    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response


@router.get("/market-pulse")
async def get_market_pulse(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("market-pulse")
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("market-pulse", limit=1)
    response = result["data"][0] if result["data"] else None
    set_cached(cache_key, response, ttl=300)
    return response


@router.get("/sector-rotation")
async def get_sector_rotation(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("sector-rotation")
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("sector-rotation", limit=50)
    set_cached(cache_key, result["data"], ttl=300)
    return result["data"]


@router.get("/group-momentum")
async def get_group_momentum(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("group-momentum")
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("group-momentum", limit=100, order_by="avg_composite_score DESC")
    set_cached(cache_key, result["data"], ttl=300)
    return result["data"]


@router.get("/watchlist")
async def get_watchlist(request: Request, codes: str | None = Query(None)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not codes:
        result = query_endpoint("watchlist", limit=100)
        return result["data"]

    code_list = [
        c.strip().upper() for c in codes.split(",")
        if c.strip() and c.strip().replace("-", "").isalnum()
    ][:20]  # cap at 20 codes
    if not code_list:
        return []
    placeholders = ", ".join("?" * len(code_list))
    rows = raw_query(
        f"SELECT * FROM market.vw_d_watchlist_context WHERE stock_code IN ({placeholders})",
        tuple(code_list),
    )
    return rows


@router.get("/whale-feed")
async def get_whale_feed(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("whale-feed")
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("whale-feed", order_by="whale_quality_score DESC", limit=50)
    set_cached(cache_key, result["data"], ttl=300)
    return result["data"]


@router.get("/distribution-warning")
async def get_distribution_warning(request: Request):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("distribution")
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("distribution", where="distribution_intensity IN ('HIGH','MEDIUM')", order_by="composite_score ASC", limit=50)
    set_cached(cache_key, result["data"], ttl=300)
    return result["data"]


@router.get("/breadth-history")
async def get_breadth_history(request: Request, days: int = Query(60, ge=1, le=365)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("breadth", days)
    cached = get_cached(cache_key)
    if cached:
        return cached

    result = query_endpoint("breadth-history", order_by="trading_date DESC", limit=days)
    set_cached(cache_key, result["data"], ttl=900)
    return result["data"]
