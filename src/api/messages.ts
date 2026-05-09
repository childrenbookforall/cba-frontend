import client from './client'
import type { DirectMessage, Conversation } from '../types/api'

export interface ConversationResult {
  conversation: Omit<Conversation, 'lastMessage' | 'unreadCount'> | null
  messages: DirectMessage[]
  hasMore: boolean
  nextCursor: string | null
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await client.get<Conversation[]>('/api/messages')
  return res.data
}

export async function getConversation(userId: string, cursor?: string): Promise<ConversationResult> {
  const res = await client.get<ConversationResult>(`/api/messages/${userId}`, {
    params: cursor ? { cursor } : undefined,
  })
  return res.data
}

export async function sendMessage(userId: string, content: string): Promise<DirectMessage> {
  const res = await client.post<DirectMessage>(`/api/messages/${userId}`, { content })
  return res.data
}

export async function markRead(userId: string): Promise<void> {
  await client.patch(`/api/messages/${userId}/read`)
}
