import client from './client'
import type { ReactionType, MessageResponse } from '../types/api'

export async function upsertReaction(postId: string, type: ReactionType): Promise<{ type: ReactionType }> {
  const res = await client.post<{ type: ReactionType }>(`/api/posts/${postId}/reactions`, { type })
  return res.data
}

export async function removeReaction(postId: string): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(`/api/posts/${postId}/reactions`)
  return res.data
}
