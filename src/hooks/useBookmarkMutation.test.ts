import { renderHook, act, waitFor } from '@testing-library/react'
import { type InfiniteData } from '@tanstack/react-query'
import { useBookmarkMutation } from './useBookmarkMutation'
import { makeQueryClient, wrapper } from '../test/helpers'
import type { Post, FeedResult } from '../types/api'

vi.mock('../api/bookmarks', () => ({
  addBookmark: vi.fn(),
  removeBookmark: vi.fn(),
}))

import { addBookmark, removeBookmark } from '../api/bookmarks'
const mockAdd = vi.mocked(addBookmark)
const mockRemove = vi.mocked(removeBookmark)

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

describe('useBookmarkMutation', () => {
  let queryClient: ReturnType<typeof makeQueryClient>

  beforeEach(() => {
    queryClient = makeQueryClient()
    mockAdd.mockResolvedValue(undefined)
    mockRemove.mockResolvedValue(undefined)
  })

  describe('optimistic updates — bookmarking', () => {
    it('flips isBookmarked to true in the feed cache before the API resolves', async () => {
      const post = makePost({ isBookmarked: false })
      queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null], makeInfiniteFeed([post]))
      mockAdd.mockReturnValue(new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => {
        const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null])
        expect(data?.pages[0].posts[0].isBookmarked).toBe(true)
      })
    })

    it('flips isBookmarked on the individual post cache entry', async () => {
      const post = makePost({ isBookmarked: false })
      queryClient.setQueryData<Post>(['post', post.id], post)
      mockAdd.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => {
        expect(queryClient.getQueryData<Post>(['post', post.id])?.isBookmarked).toBe(true)
      })
    })

    it('flips isBookmarked on pinned posts in the feed', async () => {
      const post = makePost({ isBookmarked: false })
      queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null], makeInfiniteFeed([], [post]))
      mockAdd.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => {
        const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null])
        expect(data?.pages[0].pinnedPosts[0].isBookmarked).toBe(true)
      })
    })
  })

  describe('optimistic updates — unbookmarking', () => {
    it('removes the post from the saved feed cache when unbookmarking', async () => {
      const post = makePost({ isBookmarked: true })
      queryClient.setQueryData<InfiniteData<FeedResult>>(['saved'], makeInfiniteFeed([post]))
      mockRemove.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => {
        const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['saved'])
        expect(data?.pages[0].posts).toHaveLength(0)
      })
    })

    it('does not touch the saved feed cache when bookmarking (not unbookmarking)', async () => {
      const post = makePost({ isBookmarked: false })
      const other = makePost({ id: 'post-2', isBookmarked: true })
      queryClient.setQueryData<InfiniteData<FeedResult>>(['saved'], makeInfiniteFeed([other]))
      mockAdd.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => {
        // cache should be untouched — only unbookmarking removes from saved
        const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['saved'])
        expect(data?.pages[0].posts).toHaveLength(1)
      })
    })
  })

  describe('rollback on error', () => {
    it('restores the original post cache when the API call fails', async () => {
      const post = makePost({ isBookmarked: false })
      queryClient.setQueryData<Post>(['post', post.id], post)
      mockAdd.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => result.current.isError)
      expect(queryClient.getQueryData<Post>(['post', post.id])?.isBookmarked).toBe(false)
    })

    it('restores feed snapshots when the API call fails', async () => {
      const post = makePost({ isBookmarked: false })
      queryClient.setQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null], makeInfiniteFeed([post]))
      mockAdd.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => result.current.isError)
      const data = queryClient.getQueryData<InfiniteData<FeedResult>>(['feed', 'latest', null])
      expect(data?.pages[0].posts[0].isBookmarked).toBe(false)
    })
  })

  describe('onSettled invalidation', () => {
    it('invalidates the individual post query after success', async () => {
      const post = makePost()
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => result.current.isSuccess)
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['post', post.id] }))
    })

    it('invalidates the saved posts query after success', async () => {
      const post = makePost()
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useBookmarkMutation(post), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate())

      await waitFor(() => result.current.isSuccess)
      expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ queryKey: ['saved'] }))
    })
  })
})
