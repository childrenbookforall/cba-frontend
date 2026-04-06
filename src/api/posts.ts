import client from './client'
import type { Post, LatestFeedResponse, TopFeedResponse, FeedResult, MessageResponse } from '../types/api'

export interface FeedParams {
  sort: 'latest' | 'top'
  groupId?: string | null
  cursor?: string | null
  page?: number
}

export async function fetchFeed(params: FeedParams): Promise<FeedResult> {
  const query: Record<string, string | number> = { sort: params.sort }
  if (params.groupId) query.groupId = params.groupId

  if (params.sort === 'top') {
    query.page = params.page ?? 1
    const res = await client.get<TopFeedResponse>('/api/posts', { params: query })
    return { pinnedPosts: res.data.pinnedPosts, posts: res.data.posts, hasMore: res.data.hasMore, nextCursor: null }
  } else {
    if (params.cursor) query.cursor = params.cursor
    const res = await client.get<LatestFeedResponse>('/api/posts', { params: query })
    return {
      pinnedPosts: [],
      posts: res.data.posts,
      hasMore: res.data.nextCursor !== null,
      nextCursor: res.data.nextCursor,
    }
  }
}

export async function getPost(postId: string): Promise<Post> {
  const res = await client.get<Post>(`/api/posts/${postId}`)
  return res.data
}

export interface CreatePostData {
  groupId: string
  type: 'text' | 'link' | 'photo'
  title: string
  content?: string
  linkUrl?: string
  files?: File[]
}

export async function createPost(data: CreatePostData): Promise<Post> {
  if (data.type === 'photo' && data.files?.length) {
    const form = new FormData()
    form.append('groupId', data.groupId)
    form.append('type', 'photo')
    form.append('title', data.title)
    if (data.content) form.append('content', data.content)
    for (const file of data.files) {
      form.append('media', file)
    }
    const res = await client.post<Post>('/api/posts', form)
    return res.data
  }

  const res = await client.post<Post>('/api/posts', {
    groupId: data.groupId,
    type: data.type,
    title: data.title,
    content: data.content || undefined,
    linkUrl: data.linkUrl || undefined,
  })
  return res.data
}

export async function updatePost(postId: string, data: { title: string; content?: string }): Promise<Post> {
  const res = await client.put<Post>(`/api/posts/${postId}`, data)
  return res.data
}

export async function deletePost(postId: string): Promise<MessageResponse> {
  const res = await client.delete<MessageResponse>(`/api/posts/${postId}`)
  return res.data
}

export async function searchPosts(q: string): Promise<Post[]> {
  const res = await client.get<{ posts: Post[] }>('/api/posts/search', { params: { q } })
  return res.data.posts
}

export async function flagPost(postId: string, reason?: string): Promise<MessageResponse> {
  const body: { reason?: string } = {}
  if (reason) body.reason = reason
  const res = await client.post<MessageResponse>(`/api/posts/${postId}/flag`, body)
  return res.data
}
