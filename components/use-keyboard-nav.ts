'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SHORTCUT_MAP: Record<string, string> = {
  '1': '/',
  '2': '/sector',
  '3': '/smart-money',
  '4': '/foreign-flow',
  '5': '/ksei1persen',
  '6': '/broker-tracker',
  '7': '/screener',
  '8': '/groups',
  '9': '/backtest',
  '0': '/msci-screener',
}

export function useKeyboardNav() {
  const router = useRouter()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement

      if (isInputFocused) return

      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const route = SHORTCUT_MAP[e.key]
        if (route) {
          e.preventDefault()
          router.push(route)
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])
}
