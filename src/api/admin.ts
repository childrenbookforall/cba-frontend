import client from './client'
import type {
  AdminUser,
  AdminUsersResponse,
  AdminGroup,
  GroupMembersResponse,
  AdminFlagsResponse,
  MessageResponse,
} from '../types/api'

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listAdminUsers(cursor?: string): Promise<AdminUsersResponse> {
  const res = await client.get<AdminUsersResponse>('/api/admin/users', {
    params: cursor ? { cursor } : {},
  })
  return res.data
}

export async function createAdminUser(data: {
  firstName: string
  lastName: string
  email: string
}): Promise<AdminUser> {
  const res = await client.post<AdminUser>('/api/admin/users', data)
  return res.data
}

export async function sendInvite(userId: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`/api/admin/users/${userId}/invite`)
  return res.data
}

export async function suspendUser(userId: string): Promise<{ id: string; isActive: boolean }> {
  const res = await client.patch<{ id: string; isActive: boolean }>(
    `/api/admin/users/${userId}/suspend`
  )
  return res.data
}

export async function deleteAdminUser(userId: string): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(`/api/admin/users/${userId}`)
  return res.data
}

// ── Groups ────────────────────────────────────────────────────────────────────

export async function listAdminGroups(): Promise<AdminGroup[]> {
  const res = await client.get<AdminGroup[]>('/api/admin/groups')
  return res.data
}

export async function createAdminGroup(data: {
  name: string
  slug: string
  description?: string
}): Promise<AdminGroup> {
  const res = await client.post<AdminGroup>('/api/admin/groups', data)
  return res.data
}

export async function listGroupMembers(
  groupId: string,
  params?: { cursor?: string; search?: string }
): Promise<GroupMembersResponse> {
  const res = await client.get<GroupMembersResponse>(`/api/admin/groups/${groupId}/members`, { params })
  return res.data
}

export async function addGroupMember(groupId: string, userId: string): Promise<MessageResponse> {
  const res = await client.post<MessageResponse>(`/api/admin/groups/${groupId}/members`, { userId })
  return res.data
}

export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(
    `/api/admin/groups/${groupId}/members/${userId}`
  )
  return res.data
}

// ── Posts ─────────────────────────────────────────────────────────────────────

export async function pinPost(postId: string): Promise<{ id: string; isPinned: boolean; pinnedAt: string | null }> {
  const res = await client.patch(`/api/admin/posts/${postId}/pin`)
  return res.data
}

export async function downrankPost(postId: string): Promise<{ id: string; isDownranked: boolean }> {
  const res = await client.patch(`/api/admin/posts/${postId}/downrank`)
  return res.data
}

// ── Flags ─────────────────────────────────────────────────────────────────────

export async function listAdminFlags(cursor?: string): Promise<AdminFlagsResponse> {
  const res = await client.get<AdminFlagsResponse>('/api/admin/flags', {
    params: cursor ? { cursor } : {},
  })
  return res.data
}

export async function reviewFlag(flagId: string): Promise<MessageResponse> {
  const res = await client.patch<MessageResponse>(`/api/admin/flags/${flagId}/review`)
  return res.data
}
