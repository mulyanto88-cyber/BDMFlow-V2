/** @type {import('next').NextConfig} */
const nextConfig = {
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
        source: '/api/:route(bandarmologi|broker-flow|broker-tracker|composite|foreign-flow|insider|ksei-monthly|major-holder|msci-screener|ftse-screener|radar|stock-detail|volume-aov|morning-brief)',
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
