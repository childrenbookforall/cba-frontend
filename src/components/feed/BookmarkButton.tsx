import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { addBookmark, removeBookmark } from '../../api/bookmarks'
import type { Post, FeedResult } from '../../types/api'

type InfiniteFeed = InfiniteData<FeedResult>

interface BookmarkButtonProps {
  post: Post
}

export default function BookmarkButton({ post }: BookmarkButtonProps) {
  const queryClient = useQueryClient()
  const isBookmarked = post.isBookmarked

  const mutation = useMutation({
    mutationFn: () => isBookmarked ? removeBookmark(post.id) : addBookmark(post.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['feed'] })
      await queryClient.cancelQueries({ queryKey: ['post', post.id] })
      await queryClient.cancelQueries({ queryKey: ['saved'] })

      const prevPost = queryClient.getQueryData<Post>(['post', post.id])
      const prevFeedEntries = queryClient.getQueriesData<InfiniteFeed>({ queryKey: ['feed'], exact: false })

      const applyToPost = (p: Post) =>
        p.id !== post.id ? p : { ...p, isBookmarked: !isBookmarked }

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
        old ? { ...old, isBookmarked: !isBookmarked } : old
      )

      return { prevPost, prevFeedEntries }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevPost !== undefined) {
        queryClient.setQueryData(['post', post.id], context.prevPost)
      }
      for (const [queryKey, snapshot] of context?.prevFeedEntries ?? []) {
        queryClient.setQueryData<InfiniteFeed>(queryKey, snapshot)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', post.id] })
      queryClient.invalidateQueries({ queryKey: ['saved'] })
    },
  })

  return (
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      title={isBookmarked ? 'Remove bookmark' : 'Save for later'}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold transition ${
        mutation.isPending ? 'opacity-60' : ''
      } ${
        isBookmarked
          ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 dark:text-yellow-400'
          : 'bg-surface text-muted hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-primary'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill={isBookmarked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    </button>
  )
}
