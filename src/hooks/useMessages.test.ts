import { renderHook, waitFor } from '@testing-library/react'
import { useMessages } from './useMessages'
import { makeQueryClient, wrapper } from '../test/helpers'
import type { Conversation } from '../types/api'

vi.mock('../api/messages', () => ({
  getConversations: vi.fn(),
}))

import { getConversations } from '../api/messages'
const mockGetConversations = vi.mocked(getConversations)

function makeConversation(id: string, unreadCount: number): Conversation {
  return {
    id,
    otherUser: { id: 'user-1', firstName: 'Alice' },
    lastMessage: null,
    unreadCount,
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

describe('useMessages', () => {
  let queryClient: ReturnType<typeof makeQueryClient>

  beforeEach(() => {
    queryClient = makeQueryClient()
  })

  it('returns totalUnread of 0 when there are no conversations', async () => {
    mockGetConversations.mockResolvedValue([])
    const { result } = renderHook(() => useMessages(), { wrapper: wrapper(queryClient) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.totalUnread).toBe(0)
  })

  it('sums unreadCount across all conversations', async () => {
    mockGetConversations.mockResolvedValue([
      makeConversation('c1', 3),
      makeConversation('c2', 0),
      makeConversation('c3', 7),
    ])
    const { result } = renderHook(() => useMessages(), { wrapper: wrapper(queryClient) })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.totalUnread).toBe(10)
  })

  it('returns totalUnread of 0 while loading', () => {
    mockGetConversations.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useMessages(), { wrapper: wrapper(queryClient) })
    expect(result.current.totalUnread).toBe(0)
  })

  it('uses the messages query key', async () => {
    mockGetConversations.mockResolvedValue([])
    renderHook(() => useMessages(), { wrapper: wrapper(queryClient) })
    await waitFor(() => expect(queryClient.getQueryState(['messages'])?.status).toBe('success'))
  })
})
