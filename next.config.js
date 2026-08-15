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
        // most ~once per window per key instead of every 60s.
        //
        // s-maxage=3600 + SWR=7d: data is T+1, so an hour-old edge copy is always "fresh enough";
        // the 7-day stale window only ever matters while the origin is down (SWR serves the last
        // good copy instead of an error). max-age=300 lets browsers skip the round-trip on quick
        // back-and-forth navigation. User-specific routes (watchlist, auth) and the raw-SQL POST
        // endpoint (motherduck) are excluded so nothing is shared-cached.
        source: '/api/:route(bandarmologi|broker-flow|broker-tracker|composite|foreign-flow|insider|ksei-monthly|msci-screener|ftse-screener|radar|stock-detail|volume-aov|morning-brief)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/api/alerts/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
