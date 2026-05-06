import { useInfiniteQuery } from '@tanstack/react-query'
import { listGroupMembers } from '../api/groups'

export function useGroupMembers(groupId: string | null, search: string) {
  return useInfiniteQuery({
    queryKey: ['groupMembers', groupId, search],
    queryFn: ({ pageParam }) =>
      listGroupMembers(groupId!, {
        cursor: pageParam as string | undefined,
        search: search || undefined,
      }),
    enabled: !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 60_000,
  })
}
