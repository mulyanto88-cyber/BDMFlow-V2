/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // COEP require-corp DIHAPUS — terlalu ketat, memblok font/CDN eksternal
      // dan bisa menyebabkan fetch ke /api/* hang di beberapa browser/proxy
      {
        source: '/api/:path*',
        headers: [
          // API routes: no-store agar data selalu fresh, bukan stale cache
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
