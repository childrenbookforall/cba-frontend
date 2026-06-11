import client from './client'
import type {
  AdminUser,
  AdminUsersResponse,
  AdminGroup,
  GroupMembersResponse,
  AdminFlagsResponse,
  MessageResponse,
  SiteNotification,
} from '../types/api'

// ── Users ─────────────────────────────────────────────────────────────────────

export async function listAdminUsers(cursor?: string, search?: string): Promise<AdminUsersResponse> {
  const res = await client.get<AdminUsersResponse>('/api/admin/users', {
    params: { ...(cursor && { cursor }), ...(search && { search }) },
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

export interface AdminGroupInput {
  name: string
  slug: string
  description?: string | null
  parentId?: string | null
  isPublic?: boolean
  isViewOnly?: boolean
}

export async function createAdminGroup(data: AdminGroupInput): Promise<AdminGroup> {
  const res = await client.post<AdminGroup>('/api/admin/groups', data)
  return res.data
}

export async function updateAdminGroup(
  groupId: string,
  data: Partial<AdminGroupInput>
): Promise<AdminGroup> {
  const res = await client.patch<AdminGroup>(`/api/admin/groups/${groupId}`, data)
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

// ── Site notification ─────────────────────────────────────────────────────────

export async function getAdminSiteNotification(): Promise<SiteNotification | null> {
  const res = await client.get<SiteNotification | null>('/api/admin/site-notification')
  return res.data
}

export async function upsertSiteNotification(data: {
  message: string
  linkText?: string
  linkUrl?: string
  isActive?: boolean
}): Promise<SiteNotification> {
  const res = await client.put<SiteNotification>('/api/admin/site-notification', data)
  return res.data
}

export async function toggleSiteNotification(): Promise<SiteNotification> {
  const res = await client.patch<SiteNotification>('/api/admin/site-notification/toggle')
  return res.data
}

// ── Messages ──────────────────────────────────────────────────────────────────

export interface AdminConversation {
  id: string
  userA: { id: string; firstName: string; lastName?: string | null; avatarUrl?: string | null }
  userB: { id: string; firstName: string; lastName?: string | null; avatarUrl?: string | null }
  lastMessage: { id: string; content: string; senderId: string; createdAt: string } | null
  messageCount: number
  updatedAt: string
}

export interface AdminConversationsResponse {
  conversations: AdminConversation[]
  hasMore: boolean
  nextCursor: string | null
}

export interface AdminMessageWithSender {
  id: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: { id: string; firstName: string; lastName?: string | null; avatarUrl?: string | null }
}

export interface AdminThreadResponse {
  conversation: {
    id: string
    userA: { id: string; firstName: string; lastName?: string | null }
    userB: { id: string; firstName: string; lastName?: string | null }
  }
  messages: AdminMessageWithSender[]
  hasMore: boolean
  nextCursor: string | null
}

export async function listAdminConversations(cursor?: string, q?: string): Promise<AdminConversationsResponse> {
  const params: Record<string, string> = {}
  if (cursor) params.cursor = cursor
  if (q) params.q = q
  const res = await client.get<AdminConversationsResponse>('/api/admin/messages', { params })
  return res.data
}

export async function getAdminThread(userId1: string, userId2: string, cursor?: string): Promise<AdminThreadResponse> {
  const res = await client.get<AdminThreadResponse>(`/api/admin/messages/${userId1}/${userId2}`, {
    params: cursor ? { cursor } : undefined,
  })
  return res.data
}
