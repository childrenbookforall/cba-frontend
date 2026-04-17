import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteComment, flagComment } from '../../api/comments'
import { useAuthStore } from '../../stores/authStore'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import type { Comment } from '../../types/api'


interface CommentMenuProps {
  comment: Comment
  postId: string
  onEdit: () => void
}

export default function CommentMenu({ comment, postId, onEdit }: CommentMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const toast = useToast()

  const isOwner = user?.id === comment.userId
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setFlagging(false)
        setConfirmDelete(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const deleteMutation = useMutation({
    mutationFn: () => deleteComment(comment.id),
    onSuccess: () => {
      // Optimistically remove from cache immediately so it doesn't persist during refetch
      queryClient.setQueryData<Comment[]>(['comments', postId], (old) => {
        if (!old) return old
        const withoutTop = old.filter((c) => c.id !== comment.id)
        if (withoutTop.length !== old.length) return withoutTop
        return old.map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== comment.id),
        }))
      })
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast('Comment deleted')
      setOpen(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const flagMutation = useMutation({
    mutationFn: () => flagComment(comment.id, flagReason || undefined),
    onSuccess: () => {
      setOpen(false)
      setFlagging(false)
      setFlagReason('')
      toast('Comment flagged for review')
      // Update cache so the dot appears and button disables immediately
      queryClient.setQueryData<Comment[]>(
        ['comments', postId],
        (old) => old ? old.map((c) => {
          if (c.id === comment.id) return { ...c, isFlagged: true, flaggedByMe: true }
          return {
            ...c,
            replies: c.replies?.map((r) =>
              r.id === comment.id ? { ...r, isFlagged: true, flaggedByMe: true } : r
            ),
          }
        }) : old
      )
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition p-1"
        aria-label="Comment options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-5 z-20 bg-card border border-border rounded-xl shadow-lg py-1 w-40">
          {flagging ? (
            <div className="px-3 py-2">
              <p className="text-[0.625rem] text-muted mb-1.5">Reason (optional)</p>
              <input
                autoFocus
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="What's the issue?"
                className="w-full text-xs border border-border rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:border-accent"
              />
              <div className="flex gap-1.5">
                <button
                  onClick={() => flagMutation.mutate()}
                  disabled={flagMutation.isPending}
                  className="flex-1 text-[0.625rem] font-semibold bg-red-50 text-danger rounded-lg py-1.5"
                >
                  Flag
                </button>
                <button
                  onClick={() => setFlagging(false)}
                  className="flex-1 text-[0.625rem] font-semibold bg-surface text-muted rounded-lg py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {isOwner && (
                <button
                  onClick={() => { onEdit(); setOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface text-left"
                >
                  ✏️ Edit
                </button>
              )}
              {(isOwner || isAdmin) && (
                confirmDelete ? (
                  <div className="px-3 py-2">
                    <p className="text-[0.625rem] text-gray-700 dark:text-gray-300 mb-2">Delete this comment?</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        className="flex-1 text-[0.625rem] font-semibold bg-danger text-white rounded-lg py-1.5 disabled:opacity-60"
                      >
                        {deleteMutation.isPending ? '…' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 text-[0.625rem] font-semibold bg-surface text-muted rounded-lg py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-danger hover:bg-surface text-left"
                  >
                    🗑 Delete
                  </button>
                )
              )}
              {!isOwner && (
                <button
                  onClick={() => !comment.flaggedByMe && setFlagging(true)}
                  disabled={comment.flaggedByMe}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left disabled:opacity-50 disabled:cursor-default text-danger hover:bg-surface disabled:hover:bg-transparent"
                >
                  🚩 {comment.flaggedByMe ? 'Flagged' : 'Flag'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
