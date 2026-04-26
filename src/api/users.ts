import client from './client'
import type { User, PublicProfile, PostUser } from '../types/api'

export async function getMe(): Promise<User> {
  const res = await client.get<User>('/api/users/me')
  return res.data
}

export async function updateMe(data: { bio?: string; birthday?: string | null }): Promise<User> {
  const res = await client.put<User>('/api/users/me', data)
  return res.data
}

export async function getUserById(id: string): Promise<PublicProfile> {
  const res = await client.get<PublicProfile>(`/api/users/${id}`)
  return res.data
}

export async function uploadAvatar(file: File): Promise<User> {
  const form = new FormData()
  form.append('avatar', file)
  const res = await client.post<User>('/api/users/me/avatar', form)
  return res.data
}

export async function searchUsers(q: string, groupId?: string): Promise<PostUser[]> {
  const params: Record<string, string> = { q }
  if (groupId) params.groupId = groupId
  const res = await client.get<PostUser[]>('/api/users/search', { params })
  return res.data
}
