import { Link, useLocation } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible'

export default function BottomNav() {
  const { pathname } = useLocation()
  const { data: notifications } = useNotifications()
  const unreadCount = notifications?.length ?? 0
  const keyboardVisible = useKeyboardVisible()

  if (keyboardVisible) return null

  function navCls(path: string) {
    return pathname.startsWith(path)
      ? 'text-accent'
      : 'text-muted'
  }

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex justify-around pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-10">
      <Link
        to="/feed"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium ${navCls('/feed')}`}
        aria-label="Community"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Community
      </Link>

      <Link
        to="/search"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium ${navCls('/search')}`}
        aria-label="Search"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search
      </Link>

      <Link
        to="/notifications"
        className={`relative flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium ${navCls('/notifications')}`}
        aria-label="Alerts"
      >
        <span className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span
            aria-live="polite"
            aria-atomic="true"
            aria-label={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : undefined}
            className={`absolute -top-0.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-danger text-white text-[0.5rem] font-bold flex items-center justify-center px-0.5 leading-none transition-opacity ${unreadCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount || ''}
          </span>
        </span>
        Alerts
      </Link>

      <Link
        to="/profile"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium ${navCls('/profile')}`}
        aria-label="Profile"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        Profile
      </Link>
    </nav>
  )
}
