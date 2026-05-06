import client from './client'
import type { Group, GroupMembersResponse } from '../types/api'

export async function listGroups(): Promise<Group[]> {
  const res = await client.get<Group[]>('/api/groups')
  return res.data
}

export async function listGroupMembers(
  groupId: string,
  params?: { cursor?: string; search?: string }
): Promise<GroupMembersResponse> {
  const res = await client.get<GroupMembersResponse>(`/api/groups/${groupId}/members`, { params })
  return res.data
}
