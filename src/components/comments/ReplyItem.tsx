import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Avatar from '../ui/Avatar'
import CommentMenu from './CommentMenu'
import { updateComment } from '../../api/comments'
import { formatRelativeTime, getApiError } from '../../lib/utils'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from '../../stores/toastStore'
import type { Comment } from '../../types/api'

interface ReplyItemProps {
  reply: Comment
  postId: string
  onReply: (name: string) => void
}

export default function ReplyItem({ reply, postId, onReply }: ReplyItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const queryClient = useQueryClient()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const showFlagDot = reply.isFlagged && (isAdmin || reply.flaggedByMe)
  const toast = useToast()

  const updateMutation = useMutation({
    mutationFn: () => updateComment(reply.id, editContent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      setEditing(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  return (
    <div className="flex gap-2 mt-2 ml-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-2.5">
      {reply.user ? (
        <Link to={`/profile/${reply.user.id}`}>
          <Avatar
            firstName={reply.user.firstName}
            lastName={reply.user.lastName}
            avatarUrl={reply.user.avatarUrl}
            size="sm"
          />
        </Link>
      ) : (
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {reply.user ? (
            <Link to={`/profile/${reply.user.id}`} className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300 hover:underline">
              {`${reply.user.firstName}${reply.user.lastName ? ` ${reply.user.lastName}` : ''}`}
            </Link>
          ) : (
            <span className="text-[0.625rem] font-semibold text-gray-700 dark:text-gray-300">Deleted user</span>
          )}
          <span className="text-[0.625rem] text-muted">{formatRelativeTime(reply.createdAt)}</span>
          {showFlagDot && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
              title={isAdmin ? 'Flagged for review' : 'You flagged this comment'}
            />
          )}
          <div className="ml-auto">
            <CommentMenu comment={reply} postId={postId} onEdit={() => setEditing(true)} />
          </div>
        </div>

        {editing ? (
          <div>
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="w-full text-xs border border-border rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:border-accent bg-white dark:bg-card"
            />
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !editContent.trim()}
                className="text-[0.625rem] font-semibold text-white bg-accent px-2.5 py-1 rounded-lg disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditContent(reply.content) }}
                className="text-[0.625rem] font-semibold text-muted px-2.5 py-1 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[0.625rem] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.content}</p>
            <button
              onClick={() => {
                const name = reply.user
                  ? `${reply.user.firstName}${reply.user.lastName ? ` ${reply.user.lastName}` : ''}`
                  : 'Deleted user'
                onReply(name)
              }}
              className="text-[0.625rem] text-muted hover:text-accent mt-1 font-medium transition"
            >
              Reply
            </button>
          </>
        )}
      </div>
    </div>
  )
}
