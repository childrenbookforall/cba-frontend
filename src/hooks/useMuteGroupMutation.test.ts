import { renderHook, act, waitFor } from '@testing-library/react'
import { useMuteGroupMutation } from './useMuteGroupMutation'
import { makeQueryClient, wrapper } from '../test/helpers'
import type { Group } from '../types/api'

vi.mock('../api/groups', () => ({
  muteGroup: vi.fn(),
  unmuteGroup: vi.fn(),
}))

import { muteGroup, unmuteGroup } from '../api/groups'
const mockMute = vi.mocked(muteGroup)
const mockUnmute = vi.mocked(unmuteGroup)

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'group-1',
    name: 'Group 1',
    slug: 'group-1',
    ...overrides,
  }
}

describe('useMuteGroupMutation', () => {
  let queryClient: ReturnType<typeof makeQueryClient>

  beforeEach(() => {
    queryClient = makeQueryClient()
    mockMute.mockResolvedValue(undefined)
    mockUnmute.mockResolvedValue(undefined)
  })

  describe('optimistic updates', () => {
    it('flips isMuted to true on a top-level standalone group', async () => {
      const group = makeGroup({ isMuted: false })
      queryClient.setQueryData<Group[]>(['groups'], [group])
      mockMute.mockReturnValue(new Promise(() => {})) // never resolves

      const { result } = renderHook(() => useMuteGroupMutation(), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate({ groupId: group.id, isMuted: false }))

      await waitFor(() => {
        const data = queryClient.getQueryData<Group[]>(['groups'])
        expect(data?.[0].isMuted).toBe(true)
      })
    })

    it('flips isMuted on a group nested inside a parent category', async () => {
      const child = makeGroup({ id: 'child-1', isMuted: false })
      const parent = makeGroup({ id: 'parent-1', name: 'Parent', children: [child] })
      queryClient.setQueryData<Group[]>(['groups'], [parent])
      mockMute.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useMuteGroupMutation(), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate({ groupId: child.id, isMuted: false }))

      await waitFor(() => {
        const data = queryClient.getQueryData<Group[]>(['groups'])
        expect(data?.[0].children?.[0].isMuted).toBe(true)
      })
    })

    it('flips isMuted to false when unmuting', async () => {
      const group = makeGroup({ isMuted: true })
      queryClient.setQueryData<Group[]>(['groups'], [group])
      mockUnmute.mockReturnValue(new Promise(() => {}))

      const { result } = renderHook(() => useMuteGroupMutation(), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate({ groupId: group.id, isMuted: true }))

      await waitFor(() => {
        const data = queryClient.getQueryData<Group[]>(['groups'])
        expect(data?.[0].isMuted).toBe(false)
      })
    })
  })

  describe('rollback on error', () => {
    it('restores the original groups cache when the API call fails', async () => {
      const group = makeGroup({ isMuted: false })
      queryClient.setQueryData<Group[]>(['groups'], [group])
      mockMute.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useMuteGroupMutation(), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate({ groupId: group.id, isMuted: false }))

      await waitFor(() => result.current.isError)
      expect(queryClient.getQueryData<Group[]>(['groups'])?.[0].isMuted).toBe(false)
    })
  })

  describe('onSettled invalidation', () => {
    it('invalidates the All Groups feed but not a specific-group feed', async () => {
      const group = makeGroup({ isMuted: false })
      queryClient.setQueryData<Group[]>(['groups'], [group])
      queryClient.setQueryData(['feed', 'latest', null], { pages: [], pageParams: [] })
      queryClient.setQueryData(['feed', 'latest', 'group-2'], { pages: [], pageParams: [] })

      const { result } = renderHook(() => useMuteGroupMutation(), { wrapper: wrapper(queryClient) })
      act(() => result.current.mutate({ groupId: group.id, isMuted: false }))

      await waitFor(() => result.current.isSuccess)
      expect(queryClient.getQueryState(['feed', 'latest', null])?.isInvalidated).toBe(true)
      expect(queryClient.getQueryState(['feed', 'latest', 'group-2'])?.isInvalidated).toBe(false)
    })
  })
})
