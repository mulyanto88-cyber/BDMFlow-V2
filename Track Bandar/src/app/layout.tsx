import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Track Bandar — Web Intelligence System',
  description: 'Real-time Bandar Inventory, Broker Dominance & Smart Money Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-900">
        {children}
      </body>
    </html>
  )
}
