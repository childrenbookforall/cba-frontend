import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNotifications } from '../hooks/useNotifications'
import { markOneRead, markAllRead } from '../api/notifications'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'
import { formatRelativeTime } from '../lib/utils'
import type { Notification } from '../types/api'

function notificationText(n: Notification): string {
  const who = n.triggeredBy
    ? `${n.triggeredBy.firstName}${n.triggeredBy.lastName ? ` ${n.triggeredBy.lastName}` : ''}`
    : 'Someone'
  if (n.type === 'comment_reply') {
    return `${who} replied to your comment on "${n.post.title}"`
  }
  if (n.type === 'thread_comment') {
    return `${who} also commented on "${n.post.title}"`
  }
  if (n.type === 'mention') {
    return `${who} mentioned you in "${n.post.title}"`
  }
  return `${who} commented on your post "${n.post.title}"`
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: notifications, isLoading, isError } = useNotifications()

  // Capture notifications on first load so they stay visible after marking as read
  const [displayed, setDisplayed] = useState<Notification[]>([])
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && notifications && !loadedRef.current) {
      loadedRef.current = true
      setDisplayed(notifications)
    }
  }, [isLoading, notifications])

  const markOneMutation = useMutation({
    mutationFn: markOneRead,
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old) =>
        (old ?? []).filter((n) => n.id !== notificationId)
      )
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.setQueryData(['notifications'], [])
      setDisplayed([])
    },
  })

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>Notifications - CBA</title>
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">Notifications</h1>
        <NavLinks />
        {displayed.length > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs text-accent font-medium disabled:opacity-50"
          >
            {markAllMutation.isPending ? 'Clearing…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {isError && (
          <p className="text-center text-xs text-muted py-16">
            Could not load notifications. Please try again.
          </p>
        )}

        {!isLoading && !isError && displayed.length === 0 && (
          <p className="text-center text-xs text-muted py-16">
            You're all caught up.
          </p>
        )}

        {!isLoading && !isError && displayed.length > 0 && (
          <div className="bg-card mt-2">
            {displayed.map((n) => (
              <Link
                key={n.id}
                to={`/posts/${n.post.id}`}
                onClick={() => {
                  setDisplayed((prev) => prev.filter((x) => x.id !== n.id))
                  markOneMutation.mutate(n.id)
                }}
                className="flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-surface transition"
              >
                {n.triggeredBy ? (
                  <Avatar
                    firstName={n.triggeredBy.firstName}
                    lastName={n.triggeredBy.lastName}
                    avatarUrl={n.triggeredBy.avatarUrl}
                    size="md"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-snug">
                    {notificationText(n)}
                  </p>
                  {n.comment?.content && (
                    <p className="text-[0.625rem] text-muted mt-0.5 truncate">
                      "{n.comment.content}"
                    </p>
                  )}
                  <p className="text-[0.625rem] text-muted mt-1">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
