const CACHE = 'bdmflow-v1'
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
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE).then((cache) => cache.put(event.request, clone))
        }
        return res
      })
      return cached || fetched
    })
  )
})
