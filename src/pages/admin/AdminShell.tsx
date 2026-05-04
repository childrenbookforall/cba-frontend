import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

const tabs = [
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/groups', label: 'Groups' },
  { path: '/admin/flags', label: 'Flags' },
  { path: '/admin/notification', label: 'Notification' },
]

export default function AdminShell() {
  const user = useAuthStore((s) => s.user)
  const { pathname } = useLocation()

  return (
    <div className="min-h-svh bg-surface flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">CBA</span>
          <span className="text-[0.625rem] font-bold uppercase tracking-wide bg-primary text-white dark:text-surface px-1.5 py-0.5 rounded">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted hidden sm:block">
            {user?.firstName} {user?.lastName}
          </span>
          <Link
            to="/feed"
            className="flex items-center gap-1 text-xs text-muted hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to app
          </Link>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-card border-b border-border flex px-4 gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`px-4 py-2.5 text-xs font-semibold transition border-b-2 -mb-px ${
              pathname.startsWith(tab.path)
                ? 'text-primary border-primary'
                : 'text-muted border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
