import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import cbaLogo from '../../assets/logo.png'
import Avatar from '../ui/Avatar'
import GroupChip from './GroupChip'
import ReactionButton from './ReactionButton'
import BookmarkButton from './BookmarkButton'
import PostMenu from './PostMenu'
import PostBody from './PostBody'
import { formatRelativeTime, formatName } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import type { Post } from '../../types/api'

interface PostCardProps {
  post: Post
  index?: number
}

const PostCard = memo(function PostCard({ post, index = 0 }: PostCardProps) {
  const author = post.user
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = post.isFlagged && (isAdmin || post.flaggedByMe)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Link
      to={`/posts/${post.id}`}
      className={`block bg-card rounded-xl shadow-sm shadow-black/5 mx-2 mb-2 hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all border border-transparent hover:border-border animate-fade-up${menuOpen ? ' relative z-10' : ''}`}
      style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div
          role={author ? 'button' : undefined}
          tabIndex={author ? 0 : undefined}
          aria-label={author ? `View ${formatName(author.firstName, author.lastName)}'s profile` : undefined}
          onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
          onKeyDown={(e) => { if (author && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/profile/${author.id}`) } }}
          className={author ? 'cursor-pointer rounded-full hover:ring-2 hover:ring-accent/40 transition' : ''}
        >
          {author ? (
            <Avatar
              firstName={author.firstName}
              lastName={author.lastName}
              avatarUrl={author.avatarUrl}
              badges={author.badges}
              size="md"
            />
          ) : (
            <img src={cbaLogo} alt="CBA" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              role={author ? 'button' : undefined}
              tabIndex={author ? 0 : undefined}
              onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
              onKeyDown={(e) => { if (author && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/profile/${author.id}`) } }}
              className={`text-xs font-semibold text-gray-900 dark:text-gray-100 truncate${author ? ' cursor-pointer hover:underline' : ''}`}
            >
              {author ? formatName(author.firstName, author.lastName) : "Children's Book for All"}
            </span>
            {post.group && <GroupChip id={post.group.id} name={post.group.name} />}
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
          <PostMenu post={post} onOpenChange={setMenuOpen} />
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {post.title}
        </h3>
        <PostBody post={post} compact />
      </div>

      {/* Actions */}
      <div
        onClick={(e) => {
          e.preventDefault()
          if (e.target === e.currentTarget) navigate(`/posts/${post.id}`)
        }}
        className="flex items-center gap-3 px-3 py-2 border-t border-border"
      >
        <ReactionButton post={post} type="hug" />
        <ReactionButton post={post} type="with_you" />
        <ReactionButton post={post} type="helped_me" />
        <button
          type="button"
          onClick={() => navigate(`/posts/${post.id}#comments`)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-surface text-muted hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:text-primary transition"
        >
          💬 {post._count.comments}
        </button>
        <div className="ml-auto" onClick={(e) => e.preventDefault()}>
          <BookmarkButton post={post} />
        </div>
      </div>
    </Link>
  )
})

export default PostCard
