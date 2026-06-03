from fastapi import APIRouter, Request, Query, HTTPException
from database import query
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api/deepdive", tags=["deepdive"])


@router.get("/summary")
async def get_deepdive_summary(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not stock_code:
        raise HTTPException(status_code=400, detail="stock_code required")

    cache_key = _cache_key("dd-summary", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = "SELECT * FROM market.vw_d_deepdive_summary WHERE stock_code = $1"
    rows = query(sql, (stock_code,))
    result = rows[0] if rows else None
    set_cached(cache_key, result, ttl=300)
    return result


@router.get("/price")
async def get_deepdive_price(
    request: Request,
    stock_code: str = Query(...),
    days: int = Query(90, ge=1, le=365),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not stock_code:
        raise HTTPException(status_code=400, detail="stock_code required")

    cache_key = _cache_key("dd-price", stock_code, days)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_d_deepdive_price
        WHERE stock_code = $1
        ORDER BY trading_date DESC
        LIMIT $2
    """
    rows = query(sql, (stock_code, days))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/broker")
async def get_deepdive_broker(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not stock_code:
        raise HTTPException(status_code=400, detail="stock_code required")

    cache_key = _cache_key("dd-broker", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_d_deepdive_broker
        WHERE stock_code = $1
        ORDER BY date DESC
        LIMIT 30
    """
    rows = query(sql, (stock_code,))
    set_cached(cache_key, rows, ttl=300)
    return rows


@router.get("/ksei")
async def get_deepdive_ksei(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not stock_code:
        raise HTTPException(status_code=400, detail="stock_code required")

    cache_key = _cache_key("dd-ksei", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM ksei.vw_d_deepdive_ksei
        WHERE Code = $1
        ORDER BY Date DESC
        LIMIT 24
    """
    rows = query(sql, (stock_code,))
    set_cached(cache_key, rows, ttl=900)
    return rows


@router.get("/insider")
async def get_deepdive_insider(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    if not stock_code:
        raise HTTPException(status_code=400, detail="stock_code required")

    cache_key = _cache_key("dd-insider", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM main.vw_d_deepdive_insider
        WHERE stock_code = $1
        ORDER BY transaction_date DESC
        LIMIT 50
    """
    rows = query(sql, (stock_code,))
    set_cached(cache_key, rows, ttl=300)
    return rows
