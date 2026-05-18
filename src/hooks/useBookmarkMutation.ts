import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { addBookmark, removeBookmark } from '../api/bookmarks'
import { useToast } from '../stores/toastStore'
import { getApiError } from '../lib/utils'
import type { Post, FeedResult } from '../types/api'

type InfiniteFeed = InfiniteData<FeedResult>

export function useBookmarkMutation(post: Post) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: () => post.isBookmarked ? removeBookmark(post.id) : addBookmark(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['post', post.id] })
      await queryClient.cancelQueries({ queryKey: ['saved'] })

      const prevPost = queryClient.getQueryData<Post>(['post', post.id])
      const prevFeedEntries = queryClient.getQueriesData<InfiniteFeed>({ queryKey: ['feed'], exact: false })

      const applyToPost = (p: Post) => p.id !== post.id ? p : { ...p, isBookmarked: !post.isBookmarked }

      queryClient.setQueriesData<InfiniteFeed>(
        { queryKey: ['feed'], exact: false },
        (old) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              pinnedPosts: page.pinnedPosts.map(applyToPost),
              posts: page.posts.map(applyToPost),
            })),
          }
        }
      )

      queryClient.setQueryData<Post>(['post', post.id], (old) =>
        old ? { ...old, isBookmarked: !post.isBookmarked } : old
      )

      return { prevPost, prevFeedEntries }
    },
    onError: (err, _vars, context) => {
      if (context?.prevPost !== undefined) {
        queryClient.setQueryData(['post', post.id], context.prevPost)
      }
      for (const [queryKey, snapshot] of context?.prevFeedEntries ?? []) {
        queryClient.setQueryData<InfiniteFeed>(queryKey, snapshot)
      }
      toast(getApiError(err), 'error')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      queryClient.invalidateQueries({ queryKey: ['saved'] })
    },
  })
}
