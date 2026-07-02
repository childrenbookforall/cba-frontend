import { useMutation, useQueryClient } from '@tanstack/react-query'
import { muteGroup, unmuteGroup } from '../api/groups'
import { useToast } from '../stores/toastStore'
import { getApiError } from '../lib/utils'
import type { Group } from '../types/api'

function setMuted(groups: Group[], groupId: string, isMuted: boolean): Group[] {
  return groups.map((g) => {
    if (g.id === groupId) return { ...g, isMuted }
    if (g.children) return { ...g, children: setMuted(g.children, groupId, isMuted) }
    return g
  })
}

export function useMuteGroupMutation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ groupId, isMuted }: { groupId: string; isMuted: boolean }) =>
      isMuted ? unmuteGroup(groupId) : muteGroup(groupId),
    onMutate: async ({ groupId, isMuted }) => {
      await queryClient.cancelQueries({ queryKey: ['groups'] })

      const prevGroups = queryClient.getQueryData<Group[]>(['groups'])
      queryClient.setQueryData<Group[]>(['groups'], (old) =>
        old ? setMuted(old, groupId, !isMuted) : old
      )

      return { prevGroups }
    },
    onError: (err, _vars, context) => {
      if (context?.prevGroups !== undefined) {
        queryClient.setQueryData(['groups'], context.prevGroups)
      }
      toast(getApiError(err), 'error')
    },
    onSettled: () => {
      // Muting only changes what "All Groups" (groupId === null) shows — see useFeed.ts
      queryClient.invalidateQueries({ queryKey: ['feed'], predicate: (query) => query.queryKey[2] === null })
    },
  })
}
