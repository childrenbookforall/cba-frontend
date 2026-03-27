import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// Injected by VitePWA at build time
precacheAndRoute(self.__WB_MANIFEST)

// Runtime caching: API feed (network-first, 24h)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/posts'),
  new NetworkFirst({
    cacheName: 'feed-cache',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 86400 })],
  })
)

// Runtime caching: Cloudinary images (cache-first, 7 days)
registerRoute(
  ({ url }) => url.hostname === 'res.cloudinary.com',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 86400 })],
  })
)

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return

  const { title, body, url, image } = event.data.json()

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      image: image || undefined,
      data: { url: url || '/feed' },
    })
  )
})

// Notification clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/feed'
  const isInternal = url.startsWith('/')

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      if (isInternal) {
        // Focus existing app window if open, otherwise open a new one
        const appClient = windowClients.find((c) => new URL(c.url).origin === self.location.origin)
        if (appClient) {
          appClient.focus()
          appClient.navigate(url)
        } else {
          clients.openWindow(url)
        }
      } else {
        // External URL - open in new tab
        clients.openWindow(url)
      }
    })
  )
})
