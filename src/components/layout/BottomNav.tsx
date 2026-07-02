import { Home, Search, Bookmark, User } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible'

export default function BottomNav() {
  const { pathname } = useLocation()
  const keyboardVisible = useKeyboardVisible()

  if (keyboardVisible) return null

  function navCls(path: string) {
    return pathname.startsWith(path)
      ? 'text-accent-text font-semibold bg-accent/20 rounded-xl px-3 py-1'
      : 'text-muted px-3 py-1'
  }

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border flex justify-around pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-10">
      <Link
        to="/feed"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium transition-colors ${navCls('/feed')}`}
        aria-label="Community"
      >
        <Home className="w-5 h-5" strokeWidth={2} />
        Community
      </Link>

      <Link
        to="/search"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium transition-colors ${navCls('/search')}`}
        aria-label="Search"
      >
        <Search className="w-5 h-5" strokeWidth={2} />
        Search
      </Link>

      <Link
        to="/saved"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium transition-colors ${navCls('/saved')}`}
        aria-label="Saved"
      >
        <Bookmark className="w-5 h-5" strokeWidth={2} />
        Saved
      </Link>

      <Link
        to="/profile"
        className={`flex flex-col items-center gap-0.5 text-[0.6875rem] font-medium transition-colors ${navCls('/profile')}`}
        aria-label="Profile"
      >
        <User className="w-5 h-5" strokeWidth={2} />
        Profile
      </Link>
    </nav>
  )
}
