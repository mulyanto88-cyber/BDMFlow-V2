from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SUPABASE_URL, SUPABASE_JWT_SECRET, RATE_LIMIT_FREE
import jwt
import time

security = HTTPBearer(auto_error=False)

_rate_store: dict[str, list[float]] = {}


async def verify_auth(request: Request) -> dict | None:
    """
    Verify Supabase JWT token.
    Returns user metadata dict if valid, None if no auth (free tier).
    Raises HTTPException if token invalid.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    token = auth_header.replace("Bearer ", "")
    try:
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token, SUPABASE_JWT_SECRET, algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            payload = jwt.decode(
                token, options={"verify_signature": False, "verify_aud": False}
            )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_tier(user: dict | None) -> str:
    if not user:
        return "free"
    metadata = user.get("user_metadata") or user.get("app_metadata") or {}
    return metadata.get("tier", "free")


def check_rate_limit(user_id: str, tier: str) -> None:
    """
    Per-user/tier rate limit.

    Pre-monetization (Phase 4): free/unauthenticated tier is UNLIMITED.
    Reason: the global "anon" bucket previously shared by ALL anonymous
    callers across the world makes the dashboard unusable as soon as
    the daily quota is hit by anyone.

    Phase 5 will add IP-based identification + Supabase Auth, at which
    point free-tier limits will be re-enabled per authenticated user.
    """
    if tier == "free":
        return

    limits = {"pro": 100, "institutional": 1000}
    limit = limits.get(tier, 100)

    now = time.time()
    window = 86400

    if user_id not in _rate_store:
        _rate_store[user_id] = []

    _rate_store[user_id] = [t for t in _rate_store[user_id] if t > now - window]

    if len(_rate_store[user_id]) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded ({limit}/day)")

    _rate_store[user_id].append(now)
