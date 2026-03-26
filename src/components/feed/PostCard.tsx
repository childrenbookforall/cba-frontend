import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import GroupChip from './GroupChip'
import ReactionButton from './ReactionButton'
import PostMenu from './PostMenu'
import { formatRelativeTime } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import type { Post } from '../../types/api'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const author = post.user
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = post.isFlagged && (isAdmin || post.flaggedByMe)
  const navigate = useNavigate()

  return (
    <Link
      to={`/posts/${post.id}`}
      className="block bg-card rounded-xl shadow-sm mx-2 mb-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div
          onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
          className={author ? 'cursor-pointer' : ''}
        >
          {author ? (
            <Avatar
              firstName={author.firstName}
              lastName={author.lastName}
              avatarUrl={author.avatarUrl}
              size="md"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
              className={`text-xs font-semibold text-gray-900 truncate${author ? ' cursor-pointer hover:underline' : ''}`}
            >
              {author ? `${author.firstName}${author.lastName ? ` ${author.lastName}` : ''}` : 'Deleted user'}
            </span>
            {post.group && <GroupChip name={post.group.name} />}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[0.625rem] text-muted">{formatRelativeTime(post.createdAt)}</span>
            {showFlagDot && (
              <span
                role="img"
                aria-label={isAdmin ? 'Flagged for review' : 'You flagged this post'}
                title={isAdmin ? 'Flagged for review' : 'You flagged this post'}
                className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
              />
            )}
          </div>
        </div>
        <div onClick={(e) => e.preventDefault()}>
          <PostMenu post={post} />
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 leading-snug">
          {post.title}
        </h3>

        {post.type === 'text' && post.content && (
          <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {post.type === 'link' && post.linkUrl && (() => {
          let safeUrl: string | null = null
          try {
            const parsed = new URL(post.linkUrl)
            if (parsed.protocol === 'https:' || parsed.protocol === 'http:') safeUrl = post.linkUrl
          } catch { /* invalid URL */ }
          return safeUrl ? (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1.5 flex items-center gap-2 bg-surface rounded-lg px-2.5 py-2 border border-border hover:border-accent transition"
          >
            <span className="text-base">🔗</span>
            <span className="text-xs text-accent font-medium truncate">
              {post.linkUrl.replace(/^https?:\/\//, '')}
            </span>
          </a>
          ) : null
        })()}

        {post.type === 'photo' && post.mediaUrl && (
          <>
            <img
              src={post.mediaUrl}
              alt={post.title}
              className="mt-1.5 w-full rounded-lg object-contain max-h-52 bg-gray-50"
            />
            {post.content && (
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed text-center whitespace-pre-wrap">{post.content}</p>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div
        onClick={(e) => e.preventDefault()}
        className="flex items-center gap-3 px-3 py-2 border-t border-gray-50"
      >
        <ReactionButton post={post} type="hug" />
        <ReactionButton post={post} type="with_you" />
        <ReactionButton post={post} type="helped_me" />
        <span className="flex items-center gap-1 text-xs text-muted">
          💬 {post._count.comments}
        </span>
      </div>
    </Link>
  )
}
