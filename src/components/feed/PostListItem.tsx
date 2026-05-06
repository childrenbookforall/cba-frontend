import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { flagPost } from '../../api/posts'
import { useAuthStore } from '../../stores/authStore'
import { formatRelativeTime, getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import type { Post, FeedResult } from '../../types/api'

interface PostListItemProps {
  post: Post
  index?: number
}

export default function PostListItem({ post, index = 0 }: PostListItemProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()

  const author = post.user
  const isOwner = user?.id === post.userId
  const reactionCount = post.withYouCount + post.helpedMeCount + post.hugCount
  const authorName = author
    ? `${author.firstName}${author.lastName ? ` ${author.lastName}` : ''}`
    : "Children's Book for All"

  const toast = useToast()

  const flagMutation = useMutation({
    mutationFn: () => flagPost(post.id),
    onError: (err) => toast(getApiError(err), 'error'),
    onSuccess: () => {
      const patch = { isFlagged: true, flaggedByMe: true }
      queryClient.setQueriesData<InfiniteData<FeedResult>>(
        { queryKey: ['feed'], exact: false },
        (old) => old ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            pinnedPosts: page.pinnedPosts.map((p) => p.id === post.id ? { ...p, ...patch } : p),
            posts: page.posts.map((p) => p.id === post.id ? { ...p, ...patch } : p),
          })),
        } : old
      )
    },
  })

  return (
    <Link
      to={`/posts/${post.id}`}
      className="animate-fade-up flex items-start gap-2 px-4 py-2.5 border-b border-border hover:bg-card transition-colors"
      style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
    >
      <span className="text-[0.625rem] text-muted flex-shrink-0 mt-1 min-w-[1.75rem] text-right select-none">
        {index + 1}.
      </span>
      {post.isPinned && (
        <span className="text-[0.625rem] text-muted flex-shrink-0 mt-1">📌</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
          {post.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5 text-[0.625rem] text-muted flex-wrap leading-relaxed">
          <span>{reactionCount} {reactionCount === 1 ? 'reaction' : 'reactions'} by</span>
          <span
            onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
            className={`text-gray-600 dark:text-gray-400${author ? ' hover:underline cursor-pointer' : ''}`}
          >
            {authorName}
          </span>
          <span>{formatRelativeTime(post.createdAt)}</span>
          <span className="mx-0.5 select-none">|</span>
          <span>{post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}</span>
          {!isOwner && (
            <>
              <span className="mx-0.5 select-none">|</span>
              {post.flaggedByMe ? (
                <span className="text-danger">flagged</span>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    if (!flagMutation.isPending) flagMutation.mutate()
                  }}
                  disabled={flagMutation.isPending}
                  className="hover:text-danger transition-colors disabled:opacity-50"
                >
                  flag
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
