// Service worker básico de Libra Fleet
// Estrategia: network-first con fallback al cache
// Permite que la app siga funcionando offline después de haberla usado online

const VERSION = 'libra-fleet-v1'
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(APP_SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // No cachear llamadas a Supabase ni a n8n — siempre frescas
  if (url.hostname.includes('supabase.co') || url.hostname.includes('n8n.cloud')) {
    return
  }

  // Solo cachear GET mismo origen
  if (request.method !== 'GET' || url.origin !== location.origin) return

  event.respondWith(
    fetch(request)
      .then(response => {
        // Cache solo respuestas OK
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone()
          caches.open(VERSION).then(cache => cache.put(request, copy).catch(() => {}))
        }
        return response
      })
      .catch(() => caches.match(request).then(r => r || caches.match('/')))
  )
})
