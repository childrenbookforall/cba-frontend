import { useQuery } from '@tanstack/react-query'
import { getComments } from '../api/comments'

export function useComments(postId: string) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => getComments(postId),
    staleTime: 30_000,
  })
}
