import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Sidebar from '../../components/sidebar'
import TickerTape from '../../components/ticker-tape'
import GlobalSearch from '../../components/global-search'
import ThemeToggle from '../../components/theme-toggle'
import LiveClock from '../../components/live-clock'
import KeyboardProvider from '../../components/keyboard-provider'
import InlineActionCenter from '../../components/inline-action-center'
import MobileBottomNav from '../../components/mobile-bottom-nav'
import PwaRegister from '../../components/pwa-register'
import { AuthProvider } from '@/context/auth-context'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const viewport: Viewport = {
  themeColor: '#030712',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'BDMFlow — IDX Flow Intelligence',
  description: 'Track Smart Money, Whale Positions & Institutional Flow on IDX. Daily precision. Institutional grade.',
  keywords: ['saham', 'IDX', 'KSEI', 'bandarmologi', 'smart money', 'whale', 'screener', 'BDMFlow', 'flow intelligence'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'BDMFlow',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  applicationName: 'BDMFlow',
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <PwaRegister />

        <AuthProvider>
        <KeyboardProvider>

        <div className="noise-overlay" aria-hidden="true" />

        <Sidebar />

        <div className="sidebar-offset flex flex-col min-h-screen transition-all duration-200">

          <header className="app-header sticky top-0 z-30 h-14 flex items-center px-5 gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 font-mono"
                style={{
                  background: 'linear-gradient(135deg,#e7b733,#c49a1a)',
                  color: '#0a122c',
                  boxShadow: '0 2px 10px rgba(231,183,51,0.30)',
                }}
              >B</div>
              <p className="text-sm font-black gradient-gold">BDMFlow</p>
            </div>

            <div className="hidden md:flex items-center gap-3 flex-1">
              <LiveClock />
            </div>

            <GlobalSearch />

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] text-[10px] text-muted-foreground/60">
                <span className="pulse-dot" />
                <span className="font-mono">T+1</span>
              </div>
              <ThemeToggle />
              <span className="badge-pro">PRO</span>
            </div>
          </header>

          <TickerTape />

          <main className="flex-1 px-3 sm:px-5 lg:px-7 py-4 md:py-5 pb-20 md:pb-5">
            {children}
          </main>

          <footer className="hidden md:block border-t border-white/[0.04] py-3.5 px-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10.5px] text-muted-foreground/40">
              <p>
                © 2026 <span className="font-semibold text-muted-foreground/60">BDMFlow</span>
                {' '}· IDX Flow Intelligence · Data sourced from KSEI &amp; IDX.
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
                Not financial advice. DYOR.
              </p>
            </div>
          </footer>
        </div>

        <MobileBottomNav />
        <InlineActionCenter />

        </KeyboardProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
