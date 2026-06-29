import { create } from 'zustand'

interface TerminalState {
  activeTicker: string | null
  period: number // Default period (e.g. 365 days)
  setActiveTicker: (ticker: string) => void
  setPeriod: (days: number) => void
}

export const useTerminalStore = create<TerminalState>((set) => ({
  activeTicker: null,
  period: 365,
  setActiveTicker: (ticker) => set({ activeTicker: ticker }),
  setPeriod: (days) => set({ period: days }),
}))
