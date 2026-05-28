import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getConversations } from '../api/messages'

export function useMessages() {
  const query = useQuery({
    queryKey: ['messages'],
    queryFn: getConversations,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 15_000,
  })

  const totalUnread = useMemo(
    () => query.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0,
    [query.data]
  )

  return { ...query, totalUnread }
}
