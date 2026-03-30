import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPost } from '../api/posts'
import { useComments } from '../hooks/useComments'
import Avatar from '../components/ui/Avatar'
import GroupChip from '../components/feed/GroupChip'
import ReactionButton from '../components/feed/ReactionButton'
import PostMenu from '../components/feed/PostMenu'
import CommentThread from '../components/comments/CommentThread'
import CommentInputBar from '../components/comments/CommentInputBar'
import CommentSkeleton from '../components/comments/CommentSkeleton'
import Spinner from '../components/ui/Spinner'
import { formatRelativeTime } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'
import NavLinks from '../components/layout/NavLinks'

interface ReplyingTo {
  id: string
  name: string
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: !!postId,
  })

  const { data: comments, isLoading: commentsLoading } = useComments(postId!)

  if (postLoading) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <title>Post - CBA</title>
        <Spinner />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center flex-col gap-3">
        <title>Post not found - CBA</title>
        <p className="text-sm text-muted">Post not found.</p>
        <button onClick={() => navigate('/feed')} className="text-xs text-accent underline">
          Back to feed
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface flex flex-col">
      <title>Post - CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div className="flex-1" />
        <NavLinks />
        <PostMenu post={post} />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">

        {/* Post body */}
        <div className="bg-card mb-2 px-4 pt-4 pb-3">
          {/* Author + meta */}
          <div className="flex items-center gap-2.5 mb-3">
            {post.user ? (
              <Avatar
                firstName={post.user.firstName}
                lastName={post.user.lastName}
                avatarUrl={post.user.avatarUrl}
                size="md"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-900">
                  {post.user
                    ? `${post.user.firstName}${post.user.lastName ? ` ${post.user.lastName}` : ''}`
                    : 'Deleted user'}
                </span>
                {post.group && <GroupChip name={post.group.name} />}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[0.625rem] text-muted">{formatRelativeTime(post.createdAt)}</span>
                {post.isFlagged && (isAdmin || post.flaggedByMe) && (
                  <span
                    role="img"
                    aria-label={isAdmin ? 'Flagged for review' : 'You flagged this post'}
                    title={isAdmin ? 'Flagged for review' : 'You flagged this post'}
                    className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-gray-900 leading-snug mb-2">
            {post.title}
          </h2>

          {/* Content by type */}
          {post.type === 'text' && post.content && (
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
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
              className="flex items-center gap-2.5 bg-surface border border-border rounded-xl px-3 py-2.5 hover:border-accent transition"
            >
              <span className="text-lg">🔗</span>
              <span className="text-xs text-accent font-medium break-all">
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
                className="w-full rounded-xl object-contain max-h-80"
              />
              {post.content && (
                <p className="text-xs text-muted italic text-center mt-2 leading-relaxed px-4 whitespace-pre-wrap">{post.content}</p>
              )}
            </>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
            <ReactionButton post={post} type="hug" />
            <ReactionButton post={post} type="with_you" />
            <ReactionButton post={post} type="helped_me" />
<span className="text-xs text-muted ml-1">
              💬 {post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}
            </span>
          </div>
        </div>

        {/* Comments */}
        <div id="comments" className="bg-card px-4 pt-4 pb-2">
          <h3 className="text-xs font-bold text-muted uppercase tracking-wide mb-4">
            Comments
          </h3>

          {commentsLoading ? (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </>
          ) : (
            <CommentThread
              comments={comments ?? []}
              postId={post.id}
              onReply={(id, name) => setReplyingTo({ id, name })}
            />
          )}
        </div>
      </div>

      {/* Sticky comment input */}
      <div className="fixed bottom-0 inset-x-0 z-10">
        <CommentInputBar
          postId={post.id}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}
