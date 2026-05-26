import { useState } from 'react'
import cbaLogo from '../assets/logo.png'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPost } from '../api/posts'
import { useComments } from '../hooks/useComments'
import Avatar from '../components/ui/Avatar'
import GroupChip from '../components/feed/GroupChip'
import ReactionButton from '../components/feed/ReactionButton'
import BookmarkButton from '../components/feed/BookmarkButton'
import PostMenu from '../components/feed/PostMenu'
import PostBody from '../components/feed/PostBody'
import CommentThread from '../components/comments/CommentThread'
import CommentInputBar from '../components/comments/CommentInputBar'
import CommentSkeleton from '../components/comments/CommentSkeleton'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import { formatRelativeTime, formatName } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'
import NavLinks from '../components/layout/NavLinks'
import MentionText from '../components/ui/MentionText'

interface ReplyingTo {
  id: string
  name: string
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const [replyingTo, setReplyingTo] = useState<ReplyingTo | null>(null)

  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  const { data: post, isLoading: postLoading, isError: postError, error: postErrorObj, refetch: refetchPost } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPost(postId!),
    enabled: !!postId,
  })

  const isNotFound = !post || (postError && (postErrorObj as { response?: { status?: number } } | null)?.response?.status === 404)

  const { data: comments, isLoading: commentsLoading } = useComments(postId)

  if (postLoading) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <title>Post - CBA</title>
        <Spinner />
      </div>
    )
  }

  if (postError || !post) {
    return (
      <div className="min-h-svh bg-surface flex flex-col items-center justify-center gap-4 p-8 text-center">
        <title>Post not found - CBA</title>
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isNotFound ? 'Post not found' : 'Could not load post'}
          </p>
          <p className="text-xs text-muted">
            {isNotFound ? 'This post may have been deleted.' : 'Check your connection and try again.'}
          </p>
        </div>
        <div className="flex gap-3">
          {postError && !isNotFound && (
            <button onClick={() => refetchPost()} className="px-4 py-2 bg-accent text-accent-text-fg text-xs font-semibold rounded-full">
              Try again
            </button>
          )}
          <button onClick={() => navigate('/feed')} className="px-4 py-2 border border-border text-xs font-semibold text-gray-600 dark:text-gray-400 rounded-full">
            Back to feed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface flex flex-col">
      <title>Post - CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/feed" className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 transition" />
        <div className="flex-1" />
        <NavLinks />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto">

        {/* Post body */}
        <div className="bg-card mb-2 px-4 pt-4 pb-3">
          {/* Author + meta */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {post.user ? (
              <div className="cursor-pointer" onClick={() => navigate(`/profile/${post.user!.id}`)}>
                <Avatar
                  firstName={post.user!.firstName}
                  lastName={post.user!.lastName}
                  avatarUrl={post.user!.avatarUrl}
                  size="md"
                />
              </div>
            ) : (
              <img src={cbaLogo} alt="CBA" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-xs font-semibold text-gray-900 dark:text-gray-100${post.user ? ' cursor-pointer hover:underline' : ''}`}
                  onClick={() => { if (post.user) navigate(`/profile/${post.user.id}`) }}
                >
                  {post.user ? formatName(post.user.firstName, post.user.lastName) : "Children's Book for All"}
                </span>
                {post.group && <GroupChip id={post.group.id} name={post.group.name} />}
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
            <PostMenu post={post} />
          </div>

          {/* Title */}
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2">
            <MentionText content={post.title} />
          </h2>

          <PostBody post={post} />

          {/* Reactions */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
            <ReactionButton post={post} type="hug" />
            <ReactionButton post={post} type="with_you" />
            <ReactionButton post={post} type="helped_me" />
            <span className="text-xs text-muted ml-1">
              💬 {post._count.comments} {post._count.comments === 1 ? 'comment' : 'comments'}
            </span>
            <div className="ml-auto">
              <BookmarkButton post={post} />
            </div>
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
              groupId={post.groupId}
              onReply={(id, name) => setReplyingTo({ id, name })}
            />
          )}
        </div>
        </div>{/* end max-w-2xl */}
      </div>

      {/* Sticky comment input */}
      <div className="fixed bottom-0 inset-x-0 z-10">
        <CommentInputBar
          postId={post.id}
          groupId={post.groupId}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  )
}
