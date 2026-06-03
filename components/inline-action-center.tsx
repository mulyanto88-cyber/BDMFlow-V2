'use client'

import dynamic from 'next/dynamic'

const ActionCenter = dynamic(() => import('./action-center'), { ssr: false })

export default function InlineActionCenter() {
  return <ActionCenter />
}
