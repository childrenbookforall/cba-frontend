import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSiteNotification } from '../../api/siteNotification'
import { X } from 'lucide-react'

const DISMISS_KEY = 'cba:dismissed-notification'

export default function NotificationBar() {
  const [dismissedId, setDismissedId] = useState<string | null>(
    () => sessionStorage.getItem(DISMISS_KEY)
  )

  const { data: notification } = useQuery({
    queryKey: ['site-notification'],
    queryFn: getSiteNotification,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  function handleDismiss() {
    if (!notification) return
    sessionStorage.setItem(DISMISS_KEY, notification.id)
    setDismissedId(notification.id)
  }

  if (!notification || !notification.isActive || dismissedId === notification.id) return null

  return (
    <div className="bg-accent text-accent-text-fg px-4 py-2 flex items-center justify-center gap-3 text-xs font-medium">
      <span className="flex-1 text-center leading-snug">
        {notification.message}
        {notification.linkUrl && (
          <>
            {' '}
            <a
              href={notification.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {notification.linkText || notification.linkUrl}
            </a>
          </>
        )}
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 p-3 -m-3 opacity-75 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" strokeWidth={2.5} />
      </button>
    </div>
  )
}
