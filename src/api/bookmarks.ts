import client from './client'
import type { FeedResult } from '../types/api'

export async function addBookmark(postId: string): Promise<void> {
  await client.post(`/api/posts/${postId}/bookmark`)
}

export async function removeBookmark(postId: string): Promise<void> {
  await client.delete(`/api/posts/${postId}/bookmark`)
}

export async function fetchSavedPosts(cursor?: string, q?: string): Promise<FeedResult> {
  const res = await client.get<FeedResult>('/api/bookmarks', {
    params: { ...(cursor && { cursor }), ...(q && { q }) },
  })
  return { pinnedPosts: [], posts: res.data.posts, hasMore: res.data.hasMore, nextCursor: res.data.nextCursor }
}
