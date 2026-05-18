import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { formatRelativeTime, formatName } from '../../lib/utils'
import { useBookmarkMutation } from '../../hooks/useBookmarkMutation'
import { usePostFlagMutation } from '../../hooks/usePostFlagMutation'
import type { Post } from '../../types/api'

interface PostListItemProps {
  post: Post
  index?: number
}

export default function PostListItem({ post, index = 0 }: PostListItemProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const author = post.user
  const isOwner = user?.id === post.userId
  const reactionCount = post.withYouCount + post.helpedMeCount + post.hugCount
  const authorName = author ? formatName(author.firstName, author.lastName) : "Children's Book for All"

  const bookmarkMutation = useBookmarkMutation(post)
  const flagMutation = usePostFlagMutation(post)

  return (
    <Link
      to={`/posts/${post.id}`}
      className="flex items-start gap-2 px-4 py-2.5 border-b border-border hover:bg-card transition-colors animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 30, 150)}ms` }}
    >
      <span className="text-[0.625rem] text-muted flex-shrink-0 mt-1 min-w-[1.75rem] text-right select-none">
        {index + 1}.
      </span>
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
          <span className="mx-0.5 select-none">|</span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              if (!bookmarkMutation.isPending) bookmarkMutation.mutate()
            }}
            disabled={bookmarkMutation.isPending}
            className={`transition-colors disabled:opacity-50${post.isBookmarked ? ' text-yellow-500 dark:text-yellow-400' : ' hover:text-primary'}`}
          >
            {post.isBookmarked ? 'saved' : 'save'}
          </button>
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
                    if (!flagMutation.isPending) flagMutation.mutate(undefined)
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
