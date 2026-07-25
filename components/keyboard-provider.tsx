'use client'

import { useKeyboardNav } from './use-keyboard-nav'

export default function KeyboardProvider({ children }: { children: React.ReactNode }) {
  useKeyboardNav()
  return <>{children}</>
}
