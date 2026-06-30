import { renderHook, act, waitFor } from '@testing-library/react'
import { type InfiniteData } from '@tanstack/react-query'
import { usePostFlagMutation } from './usePostFlagMutation'
import { makeQueryClient, wrapper } from '../test/helpers'
import type { Post, FeedResult } from '../types/api'

vi.mock('../api/posts', () => ({
  flagPost: vi.fn(),
  fetchFeed: vi.fn(),
}))

import { flagPost } from '../api/posts'
const mockFlagPost = vi.mocked(flagPost)

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: 'post-1',
    groupId: 'group-1',
    type: 'text',
    title: 'Test Post',
    isFlagged: false,
    isPinned: false,
    isDownranked: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    myReaction: null,
    withYouCount: 0,
    helpedMeCount: 0,
    hugCount: 0,
    flaggedByMe: false,
    isBookmarked: false,
    _count: { comments: 0, reactions: 0 },
    ...overrides,
  }
}

function makeInfiniteFeed(posts: Post[], pinnedPosts: Post[] = []): InfiniteData<FeedResult> {
  return {
    pages: [{ pinnedPosts, posts, hasMore: false, nextCursor: null }],
    pageParams: [undefined],
  }
}

describe('usePostFlagMutation', () => {
  let queryClient: ReturnType<typeof makeQueryClient>

  beforeEach(() => {
    queryClient = makeQueryClient()
    mockFlagPost.mockResolvedValue({ message: 'Flagged' })
  })

  it('patches isFlagged and flaggedByMe to true in the feed cache on success', async () => {
    const post = makePost({ isFlagged: false, flaggedByMe: false })
    queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null], makeInfiniteFeed([post]))

    const { result } = renderHook(() => usePostFlagMutation(post), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate())

    await waitFor(() => result.current.isSuccess)
    const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null])
    expect(data?.pages[0].posts[0].isFlagged).toBe(true)
    expect(data?.pages[0].posts[0].flaggedByMe).toBe(true)
  })

  it('patches the post in the pinned posts section of the feed', async () => {
    const post = makePost({ isFlagged: false })
    queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'top', null], makeInfiniteFeed([], [post]))

    const { result } = renderHook(() => usePostFlagMutation(post), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate())

    await waitFor(() => result.current.isSuccess)
    const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'top', null])
    expect(data?.pages[0].pinnedPosts[0].isFlagged).toBe(true)
  })

  it('patches the individual post cache entry', async () => {
    const post = makePost({ isFlagged: false })
    queryClient.setQueryData<Post>(['post', post.id], post)

    const { result } = renderHook(() => usePostFlagMutation(post), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate())

    await waitFor(() => result.current.isSuccess)
    const cached = queryClient.getQueryData<Post>(['post', post.id])
    expect(cached?.isFlagged).toBe(true)
    expect(cached?.flaggedByMe).toBe(true)
  })

  it('patches the saved posts cache as well', async () => {
    const post = makePost()
    queryClient.setQueryData<InfiniteData<FeedResult>>(['saved'], makeInfiniteFeed([post]))

    const { result } = renderHook(() => usePostFlagMutation(post), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate())

    await waitFor(() => result.current.isSuccess)
    const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['saved'])
    expect(data?.pages[0].posts[0].isFlagged).toBe(true)
  })

  it('only patches the matching post and leaves others unchanged', async () => {
    const target = makePost({ id: 'post-1' })
    const other = makePost({ id: 'post-2' })
    queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null], makeInfiniteFeed([target, other]))

    const { result } = renderHook(() => usePostFlagMutation(target), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate())

    await waitFor(() => result.current.isSuccess)
    const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null])
    expect(data?.pages[0].posts[0].isFlagged).toBe(true)
    expect(data?.pages[0].posts[1].isFlagged).toBe(false)
  })

  it('passes an optional reason to the API', async () => {
    const post = makePost()
    const { result } = renderHook(() => usePostFlagMutation(post), { wrapper: wrapper(queryClient) })
    act(() => result.current.mutate('spam'))
    await waitFor(() => result.current.isSuccess)
    expect(mockFlagPost).toHaveBeenCalledWith(post.id, 'spam')
  })
})
