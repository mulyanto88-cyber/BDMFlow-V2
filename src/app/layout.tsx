import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import KeyboardProvider from '@/components/keyboard-provider'
import PwaRegister from '@/components/pwa-register'
import AppShell from '@/components/app-shell'
import VercelAnalytics from '@/components/analytics'
import { AuthProvider } from '@/context/auth-context'
import { ReactQueryProvider } from '@/providers/query-provider'

// Self-hosted Geist & Geist Mono (woff2, variable 100–900).
// Next 14.1's next/font/google predates Geist on Google Fonts, so the
// files are vendored under src/app/fonts — no CDN, no runtime cost.
const geist = localFont({
  src: [
    { path: './fonts/geist-latin.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/geist-latin-ext.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist',
  display: 'swap',
  preload: true,
})

const geistMono = localFont({
  src: [
    { path: './fonts/geist-mono-latin.woff2', weight: '100 900', style: 'normal' },
    { path: './fonts/geist-mono-latin-ext.woff2', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
})

export const viewport: Viewport = {
  themeColor: '#f8fafc',
  width: 'device-width',
  initialScale: 1,
  // Pinch-zoom intentionally allowed. Locking it (maximumScale:1 / userScalable:false) fails
  // WCAG 1.4.4 and stops users enlarging the dense, small-text data tables on a phone.
}

export const metadata: Metadata = {
  title: 'BDMFlow — IDX Flow Intelligence',
  description: 'Track Smart Money, Whale Positions & Institutional Flow on IDX. Daily precision. Institutional grade.',
  keywords: ['saham', 'IDX', 'KSEI', 'bandarmologi', 'smart money', 'whale', 'screener', 'BDMFlow', 'flow intelligence'],
  metadataBase: new URL('https://bdm-flow-v2.vercel.app'),
  openGraph: {
    title: 'BDMFlow — IDX Flow Intelligence',
    description: 'Lacak Smart Money, Foreign Flow & KSEI di pasar saham Indonesia — Screener Pro, Broker Tracker, Backtest, MSCI/FTSE.',
    url: 'https://bdm-flow-v2.vercel.app',
    siteName: 'BDMFlow',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BDMFlow — IDX Flow Intelligence',
    description: 'Lacak Smart Money, Foreign Flow & KSEI di pasar saham Indonesia.',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BDMFlow',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  applicationName: 'BDMFlow',
  formatDetection: { telephone: false },
  other: { 'mobile-web-app-capable': 'yes' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="bg-background" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:font-black focus:text-sm focus:shadow-lg focus:outline-none"
        >
          Lewati ke konten utama
        </a>
        <PwaRegister />
        <VercelAnalytics />
        <div className="noise-overlay" aria-hidden="true" />

        <ReactQueryProvider>
          <AuthProvider>
            <KeyboardProvider>
              <AppShell>{children}</AppShell>
            </KeyboardProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  )
}
