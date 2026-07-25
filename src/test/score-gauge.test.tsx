import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ScoreGauge, TierBadge } from '@/components/score-gauge'

describe('ScoreGauge', () => {
  it('renders SVG with correct score text', () => {
    const { container } = render(<ScoreGauge score={75} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(container.textContent).toContain('75')
  })

  it('renders with label', () => {
    render(<ScoreGauge score={60} label="Signal" />)
    expect(document.body.textContent).toContain('Signal')
  })

  it('renders tier text', () => {
    render(<ScoreGauge score={85} />)
    expect(document.body.textContent).toContain('STRONG BUY')
  })

  it('handles sm size', () => {
    const { container } = render(<ScoreGauge score={50} size="sm" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
  })

  it('handles lg size', () => {
    const { container } = render(<ScoreGauge score={50} size="lg" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('96')
  })
})

describe('TierBadge', () => {
  it('renders tier text with underscores replaced', () => {
    const { container } = render(<TierBadge tier="STRONG_BUY" />)
    expect(container.textContent).toContain('STRONG BUY')
  })

  it('renders unknown tier as-is', () => {
    const { container } = render(<TierBadge tier="OTHER" />)
    expect(container.textContent).toContain('OTHER')
  })
})
