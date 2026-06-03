from fastapi import APIRouter, Request, Query, HTTPException
from database import query_endpoint
from services.cache import get_cached, set_cached, _cache_key
from middleware.auth import verify_auth, check_rate_limit, get_tier

router = APIRouter(prefix="/api", tags=["composite"])


def safe_int(v, default=1): return max(1, int(v or default))
def safe_str(v, default=None): return str(v) if v else default


@router.get("/composite")
async def get_composite(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    tier: str | None = Query(None),
    sector: str | None = Query(None),
):
    user = await verify_auth(request)
    tier_level = get_tier(user)
    check_rate_limit(user.get("sub", "anon") if user else "anon", tier_level)

    cache_key = _cache_key("composite", page, page_size, tier, sector)
    cached = get_cached(cache_key)
    if cached:
        return cached

    conditions = []
    if tier:
        conditions.append(f"composite_tier = '{tier.replace(chr(39), chr(39)+chr(39))}'")
    if sector:
        conditions.append(f"sector = '{sector.replace(chr(39), chr(39)+chr(39))}'")

    result = query_endpoint(
        "composite",
        where=" AND ".join(conditions) if conditions else None,
        order_by="rank_overall ASC",
        limit=page_size,
        offset=(page - 1) * page_size,
    )

    response = {"data": result["data"], "total": result["total"], "page": page, "page_size": page_size}
    set_cached(cache_key, response)
    return response
