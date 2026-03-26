import client from './client'
import type { Group } from '../types/api'

export async function listGroups(): Promise<Group[]> {
  const res = await client.get<Group[]>('/api/groups')
  return res.data
}
