/**
 * Thin, SSR-safe wrapper over Vercel Web Analytics' global queue (`window.va`),
 * which is set up by <VercelAnalytics /> (components/analytics.tsx).
 *
 * Safe to call anywhere: it no-ops on the server and before the analytics script
 * has loaded, so call sites don't need their own guards. The wire format matches
 * what the official @vercel/analytics `track()` emits: va('event', { name, data }).
 */
type EventData = Record<string, string | number | boolean | null>

export function track(name: string, data?: EventData) {
  if (typeof window === 'undefined') return
  const va = (window as unknown as { va?: (...args: unknown[]) => void }).va
  if (typeof va === 'function') va('event', { name, ...(data ? { data } : {}) })
}
