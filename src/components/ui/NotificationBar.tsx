import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { getSiteNotification } from '../../api/siteNotification'

export default function NotificationBar() {
  const token = useAuthStore((s) => s.token)
  const [dismissed, setDismissed] = useState(false)

  const { data: notification } = useQuery({
    queryKey: ['site-notification'],
    queryFn: getSiteNotification,
    enabled: !!token,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })

  if (!notification || !notification.isActive || dismissed) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-primary text-white px-4 py-2 flex items-center justify-center gap-3 text-xs font-medium shadow-sm">
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
        onClick={() => setDismissed(true)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 opacity-75 hover:opacity-100 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
