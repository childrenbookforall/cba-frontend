import { useEffect } from 'react'
import { subscribePush } from '../api/notifications'

// Converts the VAPID public key from base64 string to Uint8Array
// as required by the browser's PushManager.subscribe()
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function usePushSubscription(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission === 'denied') return

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.ready

        // Request permission if not already granted
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)

        const existing = await registration.pushManager.getSubscription()
        const subscription = existing ?? await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey.buffer as ArrayBuffer,
        })

        await subscribePush(subscription)
      } catch (err) {
        console.error('Push subscription failed:', err)
      }
    }

    subscribe()
  }, [enabled])
}
