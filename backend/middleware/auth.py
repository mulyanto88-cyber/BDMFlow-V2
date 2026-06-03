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
    limits = {"free": RATE_LIMIT_FREE, "pro": 100, "institutional": 1000}
    limit = limits.get(tier, RATE_LIMIT_FREE)

    now = time.time()
    window = 86400

    if user_id not in _rate_store:
        _rate_store[user_id] = []

    _rate_store[user_id] = [t for t in _rate_store[user_id] if t > now - window]

    if len(_rate_store[user_id]) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded ({limit}/day)")

    _rate_store[user_id].append(now)
