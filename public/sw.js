// Bump this version whenever the caching strategy changes — `activate` clears all older caches.
const CACHE = 'bdmflow-v4'
const ASSETS = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  // Let the browser handle cross-origin (e.g. unpkg chart libs) directly — don't intercept.
  if (url.origin !== self.location.origin) return

  // Never touch Vercel Analytics/Insights — it must reach Vercel's edge directly. Caching it
  // would break tracking, and a stale SW would keep serving the pre-enable 404 of script.js.
  if (url.pathname.startsWith('/_vercel/')) return

  // FRESHNESS-CRITICAL: API data + page navigations (incl. RSC) must come from the network so the
  // edge cache (s-maxage) governs freshness — NOT a stale SW copy. Fall back to cache only offline.
  const needsFresh =
    url.pathname.startsWith('/api/') ||
    event.request.mode === 'navigate' ||
    url.searchParams.has('_rsc')

  if (needsFresh) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => caches.match(event.request).then((c) => c || Response.error())) // offline fallback
    )
    return
  }

  // Static assets (JS/CSS/fonts/icons): cache-first for speed, refresh in the background.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request)
        .then((res) => {
          if (res.ok && res.type === 'basic') {
            const clone = res.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        // Swallow network failures so a background refresh never becomes an uncaught
        // rejection; fall back to cache, or a network-error Response so respondWith never
        // receives undefined (the "Failed to convert value to 'Response'" log).
        .catch(() => cached || Response.error())
      return cached || fetched
    })
  )
})
