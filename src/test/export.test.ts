import { describe, it, expect, vi } from 'vitest'
import { exportToCSV } from '@/lib/export'

describe('exportToCSV', () => {
  it('does nothing for empty array', () => {
    expect(() => exportToCSV([], 'test')).not.toThrow()
  })

  it('creates a Blob with CSV content', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:test')
    const revokeObjectURL = vi.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const mockElement = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    const originalCreateElement = document.createElement.bind(document)
    document.createElement = vi.fn((tag: string) => {
      if (tag === 'a') return mockElement as unknown as HTMLElement
      return originalCreateElement(tag)
    })

    const data = [
      { name: 'Test', value: 123 },
      { name: 'Foo, Bar', value: 456 },
    ]
    exportToCSV(data, 'export')

    expect(mockElement.click).toHaveBeenCalled()
    expect(mockElement.download).toBe('export.csv')
    expect(createObjectURL).toHaveBeenCalled()

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
    document.createElement = originalCreateElement
  })
})
