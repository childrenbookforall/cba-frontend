import { Link, useNavigate } from 'react-router-dom'
import cbaLogo from '../../assets/logo.png'
import Avatar from '../ui/Avatar'
import GroupChip from './GroupChip'
import ReactionButton from './ReactionButton'
import PostMenu from './PostMenu'
import MediaCarousel from './MediaCarousel'
import LinkPreview from './LinkPreview'
import { formatRelativeTime } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import MentionText from '../ui/MentionText'
import type { Post } from '../../types/api'

function textAlign(content: string) {
  return content.trim().split(/\s+/).length > 15 ? 'text-left' : 'text-center'
}

interface PostCardProps {
  post: Post
  index?: number
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const author = post.user
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = post.isFlagged && (isAdmin || post.flaggedByMe)
  const navigate = useNavigate()

  return (
    <Link
      to={`/posts/${post.id}`}
      className="animate-fade-up block bg-card rounded-xl shadow-sm shadow-black/5 mx-2 mb-2 hover:shadow-md hover:shadow-accent/10 hover:-translate-y-0.5 transition-all border border-transparent hover:border-border"
      style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
        <div
          onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
          className={author ? 'cursor-pointer rounded-full hover:ring-2 hover:ring-accent/40 transition' : ''}
        >
          {author ? (
            <Avatar
              firstName={author.firstName}
              lastName={author.lastName}
              avatarUrl={author.avatarUrl}
              size="md"
            />
          ) : (
            <img src={cbaLogo} alt="CBA" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              onClick={(e) => { e.preventDefault(); if (author) navigate(`/profile/${author.id}`) }}
              className={`text-xs font-semibold text-gray-900 dark:text-gray-100 truncate${author ? ' cursor-pointer hover:underline' : ''}`}
            >
              {author ? `${author.firstName}${author.lastName ? ` ${author.lastName}` : ''}` : "Children's Book for All"}
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
          <PostMenu post={post} />
        </div>
      </div>

      {/* Body */}
      <div className="px-3 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {post.title}
        </h3>

        {post.type === 'text' && post.content && (
          <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            <MentionText content={post.content} />
          </p>
        )}

        {post.type === 'link' && post.linkUrl && (
          <LinkPreview
            url={post.linkUrl}
            previewImage={post.linkPreviewImage}
            previewTitle={post.linkPreviewTitle}
            previewDescription={post.linkPreviewDescription}
          />
        )}

        {post.type === 'link' && post.content && (
          <p className={`text-xs text-gray-500 dark:text-gray-300 mt-1.5 leading-relaxed line-clamp-3 whitespace-pre-wrap ${textAlign(post.content)}`}>
            <MentionText content={post.content} />
          </p>
        )}

        {post.type === 'photo' && (post.mediaUrls?.length || post.mediaUrl) && (
          <>
            <div onClick={(e) => e.preventDefault()}>
              <MediaCarousel
                urls={post.mediaUrls?.length ? post.mediaUrls : [post.mediaUrl!]}
                alt={post.title}
                compact
                postUrl={`/posts/${post.id}`}
              />
            </div>
            {post.content && (
              <p className={`text-xs text-gray-500 dark:text-gray-300 mt-1 leading-relaxed line-clamp-3 whitespace-pre-wrap ${textAlign(post.content)}`}>
                <MentionText content={post.content} />
              </p>
            )}
          </>
        )}
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
      </div>
    </Link>
  )
}
