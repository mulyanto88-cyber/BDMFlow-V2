import os
from dotenv import load_dotenv

load_dotenv()

MOTHERDUCK_TOKEN = os.getenv("MOTHERDUCK_TOKEN", "")
MOTHERDUCK_DATABASE = os.getenv("MOTHERDUCK_DATABASE", "")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

REDIS_URL = os.getenv("REDIS_URL", "")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

CACHE_TTL_SHORT = int(os.getenv("CACHE_TTL_SHORT", "300"))   # 5 min dashboard
CACHE_TTL_LONG = int(os.getenv("CACHE_TTL_LONG", "900"))     # 15 min heavy views

RATE_LIMIT_FREE = 50       # requests/day
RATE_LIMIT_PRO = 100
RATE_LIMIT_INSTITUTIONAL = 1000
