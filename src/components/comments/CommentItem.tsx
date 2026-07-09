import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Avatar from '../ui/Avatar'
import CommentMenu from './CommentMenu'
import { updateComment } from '../../api/comments'
import { formatRelativeTime, formatName, getApiError } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../stores/toastStore'
import MentionText from '../ui/MentionText'
import MentionTextarea from '../ui/MentionTextarea'
import type { Comment } from '../../types/api'

interface CommentItemProps {
  comment: Comment
  postId: string
  groupId?: string
  onReply: (commentId: string, name: string) => void
  isReply?: boolean
}

export default function CommentItem({ comment, postId, groupId, onReply, isReply = false }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const queryClient = useQueryClient()
  const toast = useToast()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = comment.isFlagged && (isAdmin || comment.flaggedByMe)

  const updateMutation = useMutation({
    mutationFn: (content: string) => updateComment(comment.id, content),
    onSuccess: (_data, content) => {
      queryClient.setQueryData<Comment[]>(['comments', postId], (old) => {
        if (!old) return old
        return old.map((c) => {
          if (c.id === comment.id) return { ...c, content }
          return { ...c, replies: c.replies?.map((r) => r.id === comment.id ? { ...r, content } : r) }
        })
      })
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setEditing(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const authorName = comment.user
    ? formatName(comment.user.firstName, comment.user.lastName)
    : 'Deleted user'

  function handleReply() {
    onReply(isReply ? (comment.parentId ?? comment.id) : comment.id, authorName)
  }

  if (isReply) {
    return (
      <div className="flex gap-2 mt-2 ml-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-2.5">
        {comment.user ? (
          <Link to={`/profile/${comment.user.id}`}>
            <Avatar
              firstName={comment.user.firstName}
              lastName={comment.user.lastName}
              avatarUrl={comment.user.avatarUrl}
              badges={comment.user.badges}
              size="sm"
            />
          </Link>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {comment.user ? (
              <Link to={`/profile/${comment.user.id}`} className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300 hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300">{authorName}</span>
            )}
            <span className="text-[0.625rem] text-muted">{formatRelativeTime(comment.createdAt)}</span>
            {showFlagDot && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
                title={isAdmin ? 'Flagged for review' : 'You flagged this comment'}
              />
            )}
            <div className="ml-auto">
              <CommentMenu comment={comment} postId={postId} onEdit={() => setEditing(true)} />
            </div>
          </div>

          {editing ? (
            <div>
              <MentionTextarea
                autoFocus
                value={editContent}
                onChange={setEditContent}
                groupId={groupId}
                rows={2}
                className="w-full text-xs border border-border rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-accent bg-white dark:bg-card"
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={() => updateMutation.mutate(editContent)}
                  disabled={updateMutation.isPending || !editContent.trim()}
                  className="text-[0.625rem] font-semibold text-accent-text-fg bg-accent px-2.5 py-1 rounded-lg disabled:opacity-60"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(comment.content) }}
                  className="text-[0.625rem] font-semibold text-muted px-2.5 py-1 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[0.625rem] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                <MentionText content={comment.content} />
              </p>
              <button
                onClick={handleReply}
                aria-label={`Reply to ${authorName}`}
                className="text-[0.625rem] text-muted hover:text-accent-text mt-1 font-medium transition"
              >
                Reply
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="flex items-start gap-2.5">
        {comment.user ? (
          <Link to={`/profile/${comment.user.id}`}>
            <Avatar
              firstName={comment.user.firstName}
              lastName={comment.user.lastName}
              avatarUrl={comment.user.avatarUrl}
              badges={comment.user.badges}
              size="md"
            />
          </Link>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {comment.user ? (
              <Link to={`/profile/${comment.user.id}`} className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{authorName}</span>
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

          {editing ? (
            <div>
              <MentionTextarea
                autoFocus
                value={editContent}
                onChange={setEditContent}
                groupId={groupId}
                rows={3}
                className="w-full text-xs border border-border rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-accent bg-surface"
              />
              <div className="flex gap-1.5 mt-1.5">
                <button
                  onClick={() => updateMutation.mutate(editContent)}
                  disabled={updateMutation.isPending || !editContent.trim()}
                  className="text-[0.625rem] font-semibold text-accent-text-fg bg-accent px-3 py-1.5 rounded-lg disabled:opacity-60"
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
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              <MentionText content={comment.content} />
            </p>
          )}

          {!editing && (
            <button
              onClick={handleReply}
              aria-label={`Reply to ${authorName}`}
              className="text-[0.625rem] text-muted hover:text-accent-text mt-1 font-medium transition"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              groupId={groupId}
              onReply={onReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  )
}
