'use client'

import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import { track } from '@/lib/analytics'

/**
 * A Next <Link> that fires a Vercel Analytics event on click. Used for landing-page
 * CTAs so we can measure the funnel: visit → CTA click-through → signup.
 */
export default function TrackLink({
  href,
  event,
  data,
  className,
  style,
  children,
}: {
  href: string
  event: string
  data?: Record<string, string | number | boolean>
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <Link href={href} className={className} style={style} onClick={() => track(event, data)}>
      {children}
    </Link>
  )
}
