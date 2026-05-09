import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { useMessages } from '../../hooks/useMessages'
import { useThemeStore } from '../../stores/themeStore'
import { useAuthStore } from '../../stores/authStore'
import Avatar from '../ui/Avatar'

export default function NavLinks() {
  const { pathname } = useLocation()
  const { data: notifications } = useNotifications()
  const { totalUnread: messagesUnread } = useMessages()
  const unreadCount = notifications?.length ?? 0
  const { theme, setTheme } = useThemeStore()
  const user = useAuthStore((s) => s.user)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  function cls(path: string) {
    return `transition ${
      pathname.startsWith(path) ? 'text-accent' : 'text-muted hover:text-primary'
    }`
  }

  const toggleButton = (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-muted hover:text-primary transition"
    >
      {theme === 'dark' ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  )

  const messagesLink = (
    <Link to="/messages" aria-label="Messages" className={`relative ${cls('/messages')}`}>
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span
        aria-live="polite"
        aria-atomic="true"
        aria-label={messagesUnread > 0 ? `${messagesUnread} unread message${messagesUnread === 1 ? '' : 's'}` : undefined}
        className={`absolute -top-1 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-danger text-white text-[0.5rem] font-bold flex items-center justify-center px-0.5 leading-none transition-opacity ${messagesUnread > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {messagesUnread > 9 ? '9+' : messagesUnread || ''}
      </span>
    </Link>
  )

  const alertsLink = (
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
  )

  return (
    <div className="flex items-center gap-5">
      {toggleButton}
      {messagesLink}
      {alertsLink}
      <div className="hidden sm:flex items-center gap-5">
        <Link to="/feed" className={`text-xs font-semibold ${cls('/feed')}`}>Community</Link>

        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              aria-label="Account menu"
              className="flex items-center gap-1 px-1.5 py-1 rounded-full transition hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                size="sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                <Link
                  to="/search"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search
                </Link>
                <Link
                  to="/saved"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                  Saved
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <>
                    <div className="my-1 border-t border-border" />
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                      Admin
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
