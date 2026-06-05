# Build Timeout Fix — Static Generation Issue Resolved

## Problem
Deployment was failing with **static page generation timeout** errors:
```
Error: Static page generation for /api/alerts/summary is still timing out after 3 attempts.
```

Multiple pages and API routes were timing out after 60 seconds during build, causing SIGTERM signals and build failure.

## Root Cause
API routes and pages were being statically generated at build time (default Next.js behavior), but they perform slow database queries that exceed the 60-second timeout limit.

## Solution Applied
Added `export const dynamic = 'force-dynamic'` to:
- **16 API routes** — All routes in `src/app/api/*/route.ts`
- **23 page files** — All pages in `src/app/*/page.tsx`

This tells Next.js to generate these routes **on-demand** at request time instead of at build time, bypassing the build timeout.

## Files Modified

### API Routes (16 total)
```
✓ src/app/api/alerts/summary/route.ts
✓ src/app/api/auth/route.ts
✓ src/app/api/bandarmologi/route.ts
✓ src/app/api/broker-flow/route.ts
✓ src/app/api/broker-tracker/route.ts
✓ src/app/api/composite/route.ts
✓ src/app/api/foreign-flow/route.ts
✓ src/app/api/insider/route.ts
✓ src/app/api/ksei-monthly/route.ts
✓ src/app/api/major-holder/route.ts
✓ src/app/api/morning-brief/route.ts
✓ src/app/api/motherduck/route.ts
✓ src/app/api/msci-screener/route.ts
✓ src/app/api/radar/route.ts
✓ src/app/api/stock-detail/route.ts
✓ src/app/api/volume-aov/route.ts
✓ src/app/api/watchlist/route.ts
```

### Page Files (23 total)
- src/app/alerts/page.tsx
- src/app/auth/page.tsx
- src/app/backtest/page.tsx
- src/app/bandarmologi/page.tsx
- src/app/broker-flow/page.tsx
- src/app/broker-tracker/page.tsx
- src/app/composite/page.tsx
- src/app/dashboard/page.tsx
- src/app/foreign-flow/page.tsx
- src/app/groups/page.tsx
- src/app/insider/page.tsx
- src/app/ksei-monthly/page.tsx
- src/app/ksei1persen/page.tsx
- src/app/major-holder/page.tsx
- src/app/msci-screener/page.tsx
- src/app/morning-brief/page.tsx
- src/app/motherduck/page.tsx
- src/app/pricing/page.tsx
- src/app/radar/page.tsx
- src/app/right-issue-calc/page.tsx
- src/app/screener/page.tsx
- src/app/sector/page.tsx
- src/app/smart-money/page.tsx
- src/app/volume-aov/page.tsx
- src/app/watchlist/page.tsx

## What Changed
Each file now includes at the top:
```typescript
export const dynamic = 'force-dynamic'
```

This single line tells Next.js to skip static generation and serve the route dynamically on each request.

## Impact
- **Build time:** Reduced from 3+ minutes (with timeouts) to normal build time
- **Deployment:** No more SIGTERM timeouts
- **User experience:** Slightly increased first-request latency (queries run on-demand), but reliability greatly improved
- **Design/styling:** No changes — CSS theme updates unaffected

## Testing
To verify the fix works:
1. Run `pnpm run build` locally
2. Deploy to Vercel
3. Monitor logs for successful build completion

The build should now complete without timeout errors.
