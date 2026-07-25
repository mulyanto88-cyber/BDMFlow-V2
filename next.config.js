/** @type {import('next').NextConfig} */
const nextConfig = {
  // /api/alerts/summary prerenders at build time (it sets `revalidate`, not
  // `force-dynamic`, so the edge cache in headers() below stays effective).
  // Its view is heavy and MotherDuck sits in us-east-1, so the default 60s
  // budget expires mid-query and fails the build.
  staticPageGenerationTimeout: 300,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      {
        // Read-only market data refreshes once per trading day (~20:00 WIB). Cache it long at the
        // edge with stale-while-revalidate so users get instant responses and MotherDuck is hit at
        // most ~once per window per key instead of every 60s. User-specific routes (watchlist, auth)
        // and the raw-SQL POST endpoint (motherduck) are excluded so nothing is shared-cached.
        source: '/api/:route(bandarmologi|broker-flow|broker-tracker|composite|foreign-flow|insider|ksei-monthly|msci-screener|ftse-screener|radar|stock-detail|volume-aov|morning-brief)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/api/alerts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
