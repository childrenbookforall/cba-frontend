import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { deletePost, flagPost } from '../../api/posts'
import { pinPost } from '../../api/admin'
import { useAuthStore } from '../../stores/authStore'
import { getApiError } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import type { Post, FeedResult } from '../../types/api'

interface PostMenuProps {
  post: Post
}

export default function PostMenu({ post }: PostMenuProps) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [flagging, setFlagging] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const isOwner = user?.id === post.userId
  const isAdmin = user?.role === 'admin'
  const toast = useToast()

  // Close on outside click
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
    mutationFn: () => deletePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast('Post deleted')
      setOpen(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const pinMutation = useMutation({
    mutationFn: () => pinPost(post.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      toast(data.isPinned ? 'Post pinned' : 'Post unpinned')
      setOpen(false)
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  const flagMutation = useMutation({
    mutationFn: () => flagPost(post.id, flagReason || undefined),
    onSuccess: () => {
      setOpen(false)
      setFlagging(false)
      setFlagReason('')
      toast('Post flagged for review')
      // Update feed and post caches so the red dot appears immediately
      const patch = { isFlagged: true, flaggedByMe: true }
      queryClient.setQueriesData<InfiniteData<FeedResult>>(
        { queryKey: ['feed'], exact: false },
        (old) => old ? {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            posts: page.posts.map((p) => p.id === post.id ? { ...p, ...patch } : p),
          })),
        } : old
      )
      queryClient.setQueryData<Post>(
        ['post', post.id],
        (old) => old ? { ...old, ...patch } : old
      )
    },
    onError: (err) => toast(getApiError(err), 'error'),
  })

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-gray-400 hover:text-gray-600 transition p-1"
        aria-label="Post options"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-20 bg-card border border-border rounded-xl shadow-lg py-1 w-40">
          {flagging ? (
            <div className="px-3 py-2">
              <p className="text-[0.625rem] text-muted mb-1.5">Reason (optional)</p>
              <input
                autoFocus
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="What's the issue?"
                className="w-full text-xs border border-border rounded-lg px-2 py-1.5 mb-2 focus:outline-none focus:border-primary"
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
                  onClick={() => { navigate(`/posts/${post.id}/edit`); setOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-surface text-left"
                >
                  ✏️ Edit post
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => pinMutation.mutate()}
                  disabled={pinMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 hover:bg-surface text-left disabled:opacity-50"
                >
                  📌 {post.isPinned ? 'Unpin post' : 'Pin post'}
                </button>
              )}
              {(isOwner || isAdmin) && (
                confirmDelete ? (
                  <div className="px-3 py-2">
                    <p className="text-[0.625rem] text-gray-700 mb-2">Delete this post?</p>
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
                    🗑 Delete post
                  </button>
                )
              )}
              {!isOwner && (
                <button
                  onClick={() => !post.flaggedByMe && setFlagging(true)}
                  disabled={post.flaggedByMe}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left disabled:opacity-50 disabled:cursor-default text-danger hover:bg-surface disabled:hover:bg-transparent"
                >
                  🚩 {post.flaggedByMe ? 'Flagged' : 'Flag post'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
