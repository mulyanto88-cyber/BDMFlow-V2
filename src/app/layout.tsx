import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import KeyboardProvider from '../../components/keyboard-provider'
import PwaRegister from '../../components/pwa-register'
import AppShell from '../../components/app-shell'
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
  // Pinch-zoom intentionally allowed. Locking it (maximumScale:1 / userScalable:false) fails
  // WCAG 1.4.4 and stops users enlarging the dense, small-text data tables on a phone.
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
    <html lang="id" className="dark bg-background" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans antialiased`}>
        <PwaRegister />
        <div className="noise-overlay" aria-hidden="true" />

        <AuthProvider>
          <KeyboardProvider>
            <AppShell>{children}</AppShell>
          </KeyboardProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
