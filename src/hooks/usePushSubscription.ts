import { useEffect } from 'react'
import { subscribePush } from '../api/notifications'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

async function subscribeIfGranted(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  if (Notification.permission !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey.buffer as ArrayBuffer,
  })
  await subscribePush(subscription)
}

// Auto-subscribes only when the user has already granted permission (e.g. returning session).
// Does NOT request permission — call requestPushPermission() in response to a user action.
export function usePushSubscription(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    subscribeIfGranted().catch(() => {}).finally(() => { if (cancelled) return })
    return () => { cancelled = true }
  }, [enabled])
}

// Call this in response to an explicit user gesture (e.g. "Enable notifications" button).
// Returns true if permission was granted and subscription succeeded.
export async function requestPushPermission(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    await subscribeIfGranted()
    return true
  } catch (err) {
    console.error('Push subscription failed:', err)
    return false
  }
}
