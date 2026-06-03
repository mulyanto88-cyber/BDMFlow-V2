import json
import hashlib
import time
from typing import Any
import redis
from config import REDIS_URL, CACHE_TTL_SHORT

_cache: dict[str, tuple[float, Any]] = {}
_redis = None

if REDIS_URL:
    try:
        _redis = redis.from_url(REDIS_URL)
    except Exception:
        pass


def _cache_key(prefix: str, *args) -> str:
    raw = f"{prefix}:{':'.join(str(a) for a in args)}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def get_cached(key: str) -> Any | None:
    if _redis:
        try:
            val = _redis.get(key)
            return json.loads(val) if val else None
        except Exception:
            pass

    entry = _cache.get(key)
    if entry:
        expires, value = entry
        if time.time() < expires:
            return value
        del _cache[key]
    return None


def set_cached(key: str, value: Any, ttl: int = CACHE_TTL_SHORT):
    if _redis:
        try:
            _redis.setex(key, ttl, json.dumps(value, default=str))
            return
        except Exception:
            pass

    _cache[key] = (time.time() + ttl, value)


def invalidate_pattern(pattern: str):
    if _redis:
        try:
            for k in _redis.scan_iter(f"*{pattern}*"):
                _redis.delete(k)
        except Exception:
            pass

    to_remove = [k for k in _cache if pattern in k]
    for k in to_remove:
        _cache.pop(k, None)
