import client from './client'
import type { Notification, MessageResponse } from '../types/api'

export async function getNotifications(): Promise<Notification[]> {
  const res = await client.get<Notification[]>('/api/notifications')
  return res.data
}

export async function markOneRead(notificationId: string): Promise<MessageResponse> {
  const res = await client.patch<MessageResponse>(`/api/notifications/${notificationId}/read`)
  return res.data
}

export async function markAllRead(): Promise<MessageResponse> {
  const res = await client.patch<MessageResponse>('/api/notifications/read')
  return res.data
}

export async function subscribePush(subscription: PushSubscription): Promise<void> {
  const { endpoint, keys } = subscription.toJSON()
  await client.post('/api/notifications/subscribe', { endpoint, keys })
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  await client.delete('/api/notifications/subscribe', { data: { endpoint } })
}
