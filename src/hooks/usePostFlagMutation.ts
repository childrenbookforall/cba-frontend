import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { flagPost } from '../api/posts'
import { useToast } from '../stores/toastStore'
import { getApiError } from '../lib/utils'
import type { Post, FeedResult } from '../types/api'

type InfiniteFeed = InfiniteData<FeedResult>

export function usePostFlagMutation(post: Post) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (reason?: string) => flagPost(post.id, reason),
    onSuccess: () => {
      const patch = { isFlagged: true, flaggedByMe: true }
      const applyPatch = (old: InfiniteFeed | undefined) => old ? {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          pinnedPosts: page.pinnedPosts.map((p) => p.id === post.id ? { ...p, ...patch } : p),
          posts: page.posts.map((p) => p.id === post.id ? { ...p, ...patch } : p),
        })),
      } : old
      queryClient.setQueriesData<InfiniteFeed>({ queryKey: ['feed'], exact: false }, applyPatch)
      queryClient.setQueriesData<InfiniteFeed>({ queryKey: ['saved'], exact: false }, applyPatch)
      queryClient.setQueryData<Post>(
        ['post', post.id],
        (old) => old ? { ...old, ...patch } : old
      )
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })
}
