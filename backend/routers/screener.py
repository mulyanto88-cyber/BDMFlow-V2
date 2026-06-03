from fastapi import APIRouter, Request, Query
from database import query_endpoint, query
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api", tags=["screener"])


TYPE_FILTER = {
    "all": "1=1",
    "daily": "daily_trigger_score >= 20",
    "ksei": "ksei_score >= 8",
    "conviction": "composite_tier IN ('STRONG_BUY','BUY','ACCUMULATE')",
    "stealth": "stealth_quality IN ('CONFIRMED_TRIPLE','HIGH','STRONG','MODERATE')",
}


@router.get("/screener")
async def get_screener(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    type: str = Query("all"),
    sector: str | None = Query(None),
    sort: str = Query("composite_score"),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("screener", type, page, page_size, sector, sort)
    cached = get_cached(cache_key)
    if cached:
        return cached

    conditions = [TYPE_FILTER.get(type, "1=1")]
    if sector:
        conditions.append(f"sector = '{sector.replace(chr(39), chr(39)+chr(39))}'")

    result = query_endpoint(
        "screener",
        where=" AND ".join(conditions),
        order_by=f"{sort} DESC",
        limit=page_size,
        offset=(page - 1) * page_size,
    )

    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response


@router.get("/foreign-history")
async def get_foreign_history(
    request: Request,
    stock_code: str | None = Query(None),
    days: int = Query(30, ge=1, le=365),
):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("foreign-history", stock_code, days)
    cached = get_cached(cache_key)
    if cached:
        return cached

    if stock_code:
        sql = """
            SELECT * FROM market.vw_d_foreign_flow_history
            WHERE stock_code = $1
            ORDER BY trading_date DESC
            LIMIT $2
        """
        rows = query(sql, (stock_code, days))
    else:
        sql = """
            SELECT trading_date, SUM(net_foreign_5d_miliar) AS total_foreign
            FROM market.vw_d_foreign_flow_history
            GROUP BY trading_date
            ORDER BY trading_date DESC
            LIMIT $1
        """
        rows = query(sql, (days,))

    set_cached(cache_key, rows, ttl=900)
    return rows


@router.get("/broker-map")
async def get_broker_map(request: Request, stock_code: str = Query(...)):
    user = await verify_auth(request)
    check_rate_limit(user.get("sub", "anon") if user else "anon", get_tier(user))

    cache_key = _cache_key("broker-map", stock_code)
    cached = get_cached(cache_key)
    if cached:
        return cached

    sql = """
        SELECT * FROM market.vw_d_top_broker_net
        WHERE stock_code = $1
        ORDER BY rank_by_5d_net ASC
        LIMIT 30
    """
    rows = query(sql, (stock_code,))
    set_cached(cache_key, rows, ttl=300)
    return rows
