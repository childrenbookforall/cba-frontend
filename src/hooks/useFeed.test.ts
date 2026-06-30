import { renderHook, waitFor, act } from '@testing-library/react'
import { useFeed } from './useFeed'
import { makeQueryClient, wrapper } from '../test/helpers'
import type { FeedResult } from '../types/api'

vi.mock('../api/posts', () => ({
  fetchFeed: vi.fn(),
}))

import { fetchFeed } from '../api/posts'
const mockFetchFeed = vi.mocked(fetchFeed)

function makePage(overrides: Partial<FeedResult> = {}): FeedResult {
  return {
    pinnedPosts: [],
    posts: [],
    hasMore: false,
    nextCursor: null,
    ...overrides,
  }
}

describe('useFeed', () => {
  let queryClient: ReturnType<typeof makeQueryClient>

  beforeEach(() => {
    queryClient = makeQueryClient()
    mockFetchFeed.mockClear()
    mockFetchFeed.mockResolvedValue(makePage())
  })

  describe('latest sort — cursor-based pagination', () => {
    it('passes cursor: undefined on the first page', async () => {
      const { result } = renderHook(() => useFeed({ sort: 'latest' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockFetchFeed).toHaveBeenCalledWith(expect.objectContaining({ sort: 'latest', cursor: undefined }))
    })

    it('passes the nextCursor value when fetching the next page', async () => {
      mockFetchFeed.mockResolvedValueOnce(makePage({ nextCursor: 'cursor-abc', hasMore: true }))
      const { result } = renderHook(() => useFeed({ sort: 'latest' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(result.current.hasNextPage).toBe(true))

      await act(() => result.current.fetchNextPage())
      await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false))

      expect(mockFetchFeed).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'cursor-abc' }))
    })

    it('reports no next page when nextCursor is null', async () => {
      mockFetchFeed.mockResolvedValue(makePage({ nextCursor: null }))
      const { result } = renderHook(() => useFeed({ sort: 'latest' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.hasNextPage).toBe(false)
    })

    it('includes groupId in the query key', async () => {
      renderHook(() => useFeed({ sort: 'latest', groupId: 'group-1' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(queryClient.getQueryState(['feed', 'latest', 'group-1'])).toBeDefined())
    })

    it('uses null in query key when groupId is not provided', async () => {
      renderHook(() => useFeed({ sort: 'latest' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(queryClient.getQueryState(['feed', 'latest', null])).toBeDefined())
    })
  })

  describe('top sort — page-based pagination', () => {
    it('does not pass a cursor for the top sort', async () => {
      renderHook(() => useFeed({ sort: 'top' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(mockFetchFeed).toHaveBeenCalled())
      expect(mockFetchFeed).toHaveBeenCalledWith(expect.objectContaining({ sort: 'top', page: 1, cursor: undefined }))
    })

    it('passes the next page number when hasMore is true', async () => {
      mockFetchFeed.mockResolvedValueOnce(makePage({ hasMore: true }))
      const { result } = renderHook(() => useFeed({ sort: 'top' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(result.current.hasNextPage).toBe(true))

      await act(() => result.current.fetchNextPage())
      await waitFor(() => expect(result.current.isFetchingNextPage).toBe(false))

      expect(mockFetchFeed).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
    })

    it('reports no next page when hasMore is false', async () => {
      mockFetchFeed.mockResolvedValue(makePage({ hasMore: false }))
      const { result } = renderHook(() => useFeed({ sort: 'top' }), { wrapper: wrapper(queryClient) })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.hasNextPage).toBe(false)
    })
  })
})
