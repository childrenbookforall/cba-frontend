import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { listAdminFlags, reviewFlag } from '../../api/admin'
import { deletePost } from '../../api/posts'
import { deleteComment } from '../../api/comments'
import { getApiError, formatRelativeTime } from '../../lib/utils'
import { useToast } from '../../stores/toastStore'
import Spinner from '../../components/ui/Spinner'
import type { AdminFlag } from '../../types/api'

export default function AdminFlagsPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [flags, setFlags] = useState<AdminFlag[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function loadFlags(cursor?: string) {
    try {
      const res = await listAdminFlags(cursor)
      setFlags((prev) => (cursor ? [...prev, ...res.flags] : res.flags))
      setNextCursor(res.nextCursor)
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { loadFlags() }, [])

  async function handleDismiss(flagId: string) {
    setDismissingId(flagId)
    try {
      await reviewFlag(flagId)
      setFlags((prev) => prev.filter((f) => f.id !== flagId))
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setDismissingId(null)
    }
  }

  async function handleDeleteAndDismiss(flag: AdminFlag) {
    setConfirmDeleteId(null)
    setDeletingId(flag.id)
    try {
      if (flag.contentType === 'post' && flag.post) {
        await deletePost(flag.post.id)
      } else if (flag.contentType === 'comment' && flag.comment) {
        await deleteComment(flag.comment.id)
      }
      // Deleting the content cascades to the flag in the DB, so no need to call reviewFlag
      setFlags((prev) => prev.filter((f) => f.id !== flag.id))
    } catch (err) {
      toast(getApiError(err), 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <title>Flags — Admin · CBA</title>
      <p className="text-[10px] text-muted mb-4">
        {flags.length} unreviewed flag{flags.length !== 1 ? 's' : ''}
        {nextCursor ? ' (more available)' : ''}
      </p>

      {flags.length === 0 ? (
        <div className="bg-card border border-border rounded-xl py-16 text-center">
          <p className="text-xs text-muted">No unreviewed flags. All clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="bg-card border border-border rounded-xl p-4"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Content type badge */}
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      flag.contentType === 'post'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {flag.contentType}
                  </span>

                  {/* Flagged by */}
                  <span className="text-[10px] text-muted">
                    Flagged by{' '}
                    <span className="font-medium text-gray-700">
                      {flag.flaggedBy
                        ? `${flag.flaggedBy.firstName} ${flag.flaggedBy.lastName}`
                        : 'deleted user'}
                    </span>
                  </span>

                  <span className="text-[10px] text-muted">
                    {formatRelativeTime(flag.createdAt)}
                  </span>
                </div>

                <div className="flex gap-1.5 flex-shrink-0">
                  {confirmDeleteId === flag.id ? (
                    <>
                      <span className="text-[10px] text-danger font-medium self-center">Sure?</span>
                      <button
                        onClick={() => handleDeleteAndDismiss(flag)}
                        className="text-[10px] font-semibold text-white bg-danger px-3 py-1.5 rounded-lg"
                      >
                        {deletingId === flag.id ? <Spinner size="sm" /> : 'Yes, delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] font-semibold text-muted border border-border px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setConfirmDeleteId(flag.id)}
                        disabled={!!deletingId || !!dismissingId}
                        className="text-[10px] font-semibold text-danger border border-danger px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-red-50 transition"
                      >
                        {deletingId === flag.id ? <Spinner size="sm" /> : `Delete ${flag.contentType}`}
                      </button>
                      <button
                        onClick={() => handleDismiss(flag.id)}
                        disabled={!!deletingId || !!dismissingId}
                        className="text-[10px] font-semibold text-gray-600 border border-border px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
                      >
                        {dismissingId === flag.id ? <Spinner size="sm" /> : 'Dismiss'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Reason */}
              {flag.reason && (
                <div className="mb-3 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-semibold text-yellow-800 mb-0.5">Reason given</p>
                  <p className="text-xs text-yellow-900">{flag.reason}</p>
                </div>
              )}

              {/* Flagged content preview */}
              {flag.contentType === 'post' && flag.post && (
                <div className="bg-surface rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1">Post</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{flag.post.title}</p>
                  </div>
                  <Link
                    to={`/posts/${flag.post.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-semibold text-accent border border-accent px-2.5 py-1 rounded-lg hover:bg-blue-50 transition flex-shrink-0"
                  >
                    View ↗
                  </Link>
                </div>
              )}

              {flag.contentType === 'comment' && flag.comment && (
                <div className="bg-surface rounded-lg px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">Comment</p>
                    {flag.comment.post && (
                      <Link
                        to={`/posts/${flag.comment.post.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-accent border border-accent px-2.5 py-1 rounded-lg hover:bg-blue-50 transition flex-shrink-0"
                      >
                        View in post ↗
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 italic">"{flag.comment.content}"</p>
                  {flag.comment.post && (
                    <p className="text-[10px] text-muted mt-1 truncate">{flag.comment.post.title}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* More */}
      {nextCursor && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => { setLoadingMore(true); loadFlags(nextCursor) }}
            disabled={loadingMore}
            className="px-6 py-2 rounded-full bg-surface border border-border text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
          >
            {loadingMore ? <Spinner size="sm" /> : 'More'}
          </button>
        </div>
      )}
    </div>
  )
}
