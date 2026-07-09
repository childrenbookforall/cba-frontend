import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, MessageSquare, Bell, ChevronDown, Search, Bookmark, User } from 'lucide-react'
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
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [dropdownOpen])

  function cls(path: string) {
    return `transition ${
      pathname.startsWith(path) ? 'text-accent-text font-semibold' : 'text-muted hover:text-primary'
    }`
  }

  const toggleButton = (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="text-muted hover:text-primary transition"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5" strokeWidth={2} />
      ) : (
        <Moon className="w-5 h-5" strokeWidth={2} />
      )}
    </button>
  )

  const messagesLink = (
    <Link to="/messages" aria-label="Messages" className={`relative ${cls('/messages')}`}>
      <MessageSquare className="w-5 h-5" strokeWidth={2} />
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
      <Bell className="w-5 h-5" strokeWidth={2} />
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
              aria-expanded={dropdownOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1 px-1.5 py-1 rounded-full transition hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
            >
              <Avatar
                firstName={user.firstName}
                lastName={user.lastName}
                avatarUrl={user.avatarUrl}
                badges={user.badges}
                size="sm"
              />
              <ChevronDown className={`w-3 h-3 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
            </button>

            {dropdownOpen && (
              <div role="menu" className="absolute right-0 top-full mt-2 w-44 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                <Link
                  role="menuitem"
                  to="/search"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <Search className="w-4 h-4 text-muted" strokeWidth={2} />
                  Search
                </Link>
                <Link
                  role="menuitem"
                  to="/saved"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <Bookmark className="w-4 h-4 text-muted" strokeWidth={2} />
                  Saved
                </Link>
                <Link
                  role="menuitem"
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-surface transition"
                >
                  <User className="w-4 h-4 text-muted" strokeWidth={2} />
                  Profile
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
