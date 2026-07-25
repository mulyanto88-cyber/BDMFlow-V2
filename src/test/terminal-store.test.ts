import { describe, it, expect, beforeEach } from 'vitest'
import { useTerminalStore } from '@/store/terminal-store'

describe('useTerminalStore', () => {
  beforeEach(() => {
    useTerminalStore.setState({ activeTicker: null, period: 365 })
  })

  it('has default values', () => {
    const state = useTerminalStore.getState()
    expect(state.activeTicker).toBeNull()
    expect(state.period).toBe(365)
  })

  it('sets active ticker', () => {
    useTerminalStore.getState().setActiveTicker('BBCA')
    expect(useTerminalStore.getState().activeTicker).toBe('BBCA')
  })

  it('sets period', () => {
    useTerminalStore.getState().setPeriod(30)
    expect(useTerminalStore.getState().period).toBe(30)
  })

  it('updates activeTicker independently of period', () => {
    useTerminalStore.getState().setActiveTicker('BBRI')
    useTerminalStore.getState().setPeriod(90)
    const state = useTerminalStore.getState()
    expect(state.activeTicker).toBe('BBRI')
    expect(state.period).toBe(90)
  })
})
