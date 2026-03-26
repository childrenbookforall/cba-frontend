import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeed } from '../api/posts'

interface UseFeedParams {
  sort: 'latest' | 'top'
  groupId?: string | null
}

export function useFeed({ sort, groupId }: UseFeedParams) {
  return useInfiniteQuery({
    queryKey: ['feed', sort, groupId ?? null],
    queryFn: ({ pageParam }) =>
      fetchFeed({
        sort,
        groupId,
        cursor: sort === 'latest' ? (pageParam as string | undefined) : undefined,
        page: sort === 'top' ? ((pageParam as number | undefined) ?? 1) : undefined,
      }),
    initialPageParam: undefined as string | number | undefined,
    getNextPageParam: (lastPage, allPages): string | number | undefined => {
      if (sort === 'latest') return lastPage.nextCursor ?? undefined
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    staleTime: 30_000,
  })
}
