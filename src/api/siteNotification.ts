import client from './client'
import type { SiteNotification } from '../types/api'

export async function getSiteNotification(): Promise<SiteNotification | null> {
  const res = await client.get<SiteNotification | null>('/api/site-notification')
  return res.data
}
