import client from './client'
import type { Comment, MessageResponse } from '../types/api'

export async function getComments(postId: string): Promise<Comment[]> {
  const res = await client.get<Comment[]>(`/api/posts/${postId}/comments`)
  return res.data
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<Comment> {
  const body: { content: string; parentId?: string } = { content }
  if (parentId) body.parentId = parentId

  const res = await client.post<Comment>(`/api/posts/${postId}/comments`, body)
  return res.data
}

export async function updateComment(commentId: string, content: string): Promise<Comment> {
  const res = await client.put<Comment>(`/api/comments/${commentId}`, { content })
  return res.data
}

export async function deleteComment(commentId: string): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(`/api/comments/${commentId}`)
  return res.data
}

export async function flagComment(
  commentId: string,
  reason?: string
): Promise<MessageResponse> {
  const body: { reason?: string } = {}
  if (reason) body.reason = reason
  const res = await client.post<MessageResponse>(`/api/comments/${commentId}/flag`, body)
  return res.data
}
