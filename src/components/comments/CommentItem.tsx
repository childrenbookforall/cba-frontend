import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Avatar from '../ui/Avatar'
import CommentMenu from './CommentMenu'
import ReplyItem from './ReplyItem'
import { updateComment } from '../../api/comments'
import { formatRelativeTime, getApiError } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../stores/toastStore'
import type { Comment } from '../../types/api'

interface CommentItemProps {
  comment: Comment
  postId: string
  onReply: (commentId: string, name: string) => void
}

export default function CommentItem({ comment, postId, onReply }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const queryClient = useQueryClient()
  const toast = useToast()

  const updateMutation = useMutation({
    mutationFn: () => updateComment(comment.id, editContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setEditing(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = comment.isFlagged && (isAdmin || comment.flaggedByMe)

  const authorName = comment.user
    ? `${comment.user.firstName}${comment.user.lastName ? ` ${comment.user.lastName}` : ''}`
    : 'Deleted user'

  return (
    <div className="mb-4">
      {/* Comment header */}
      <div className="flex items-start gap-2.5">
        {comment.user ? (
          <Link to={`/profile/${comment.user.id}`}>
            <Avatar
              firstName={comment.user.firstName}
              lastName={comment.user.lastName}
              avatarUrl={comment.user.avatarUrl}
              size="md"
            />
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {comment.user ? (
              <Link to={`/profile/${comment.user.id}`} className="text-xs font-semibold text-gray-900 hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-gray-900">{authorName}</span>
            )}
            <span className="text-[0.625rem] text-muted">{formatRelativeTime(comment.createdAt)}</span>
            {showFlagDot && (
              <span
                role="img"
                aria-label={isAdmin ? 'Flagged for review' : 'You flagged this comment'}
                title={isAdmin ? 'Flagged for review' : 'You flagged this comment'}
                className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
              />
            )}
            <div className="ml-auto">
              <CommentMenu comment={comment} postId={postId} onEdit={() => setEditing(true)} />
            </div>
          </div>

          {/* Body or edit form */}
          {editing ? (
            <div>
              <textarea
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-xs border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-primary bg-surface"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={() => updateMutation.mutate()}
                  disabled={updateMutation.isPending || !editContent.trim()}
                  className="text-[0.625rem] font-semibold text-white bg-primary px-3 py-1.5 rounded-lg disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(comment.content) }}
                  className="text-[0.625rem] font-semibold text-muted px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
          )}

          {/* Reply button */}
          {!editing && (
            <button
              onClick={() => onReply(comment.id, authorName)}
              className="text-[0.625rem] text-muted hover:text-accent mt-1 font-medium transition"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} postId={postId} />
          ))}
        </div>
      )}
    </div>
  )
}
