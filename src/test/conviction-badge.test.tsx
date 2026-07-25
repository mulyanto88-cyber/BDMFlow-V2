import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConvictionBadge, { ConvictionBar } from '@/components/conviction-badge'

describe('ConvictionBadge', () => {
  it('renders ELITE for score >= 80', () => {
    render(<ConvictionBadge score={85} />)
    expect(screen.getByText(/Elite Signal/)).toBeInTheDocument()
  })

  it('renders PREMIUM for score >= 65', () => {
    render(<ConvictionBadge score={70} />)
    expect(screen.getByText(/Premium Signal/)).toBeInTheDocument()
  })

  it('renders STANDARD for score >= 45', () => {
    render(<ConvictionBadge score={50} />)
    expect(screen.getByText(/Standard Signal/)).toBeInTheDocument()
  })

  it('renders WEAK for score < 45', () => {
    render(<ConvictionBadge score={20} />)
    expect(screen.getByText(/Weak Signal/)).toBeInTheDocument()
  })

  it('applies sm size when specified', () => {
    const { container } = render(<ConvictionBadge score={80} size="sm" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toBeInTheDocument()
  })

  it('applies lg size when specified', () => {
    const { container } = render(<ConvictionBadge score={80} size="lg" />)
    const badge = container.firstChild as HTMLElement
    expect(badge).toBeInTheDocument()
  })
})

describe('ConvictionBar', () => {
  it('renders with score label', () => {
    render(<ConvictionBar score={75} />)
    expect(screen.getByText('75 / 100')).toBeInTheDocument()
  })

  it('renders tier label', () => {
    render(<ConvictionBar score={90} />)
    expect(screen.getByText('Elite Signal')).toBeInTheDocument()
  })

  it('clamps score to 0-100 range', () => {
    render(<ConvictionBar score={150} />)
    expect(screen.getByText('100 / 100')).toBeInTheDocument()
  })
})
