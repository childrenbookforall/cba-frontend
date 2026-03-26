import { useQuery } from '@tanstack/react-query'
import { listGroups } from '../api/groups'

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: listGroups,
    staleTime: 10 * 60 * 1000, // groups rarely change
  })
}
