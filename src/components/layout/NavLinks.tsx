import { Link, useLocation } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'

export default function NavLinks() {
  const { pathname } = useLocation()
  const { data: notifications } = useNotifications()
  const unreadCount = notifications?.length ?? 0

  function cls(path: string) {
    return `transition ${
      pathname.startsWith(path) ? 'text-primary' : 'text-muted hover:text-gray-700'
    }`
  }

  return (
    <div className="hidden sm:flex items-center gap-5">
      <Link to="/feed" className={`text-xs font-semibold ${cls('/feed')}`}>Feed</Link>

      <Link to="/search" aria-label="Search" className={cls('/search')}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </Link>

      <Link to="/notifications" aria-label="Alerts" className={`relative ${cls('/notifications')}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <span
          aria-live="polite"
          aria-atomic="true"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : undefined}
          className={`absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-danger text-white text-[0.5rem] font-bold flex items-center justify-center px-0.5 leading-none transition-opacity ${unreadCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {unreadCount > 9 ? '9+' : unreadCount || ''}
        </span>
      </Link>

      <Link to="/profile" aria-label="Profile" className={cls('/profile')}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </div>
  )
}
