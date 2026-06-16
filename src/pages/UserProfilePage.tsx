import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '../api/users'
import { useAuthStore } from '../stores/authStore'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BackButton from '../components/ui/BackButton'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="min-h-svh bg-surface flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (isError || !user) {
    return (
      <div className="min-h-svh bg-surface flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-muted">User not found.</p>
        <button onClick={() => window.history.state?.idx > 0 ? navigate(-1) : navigate('/feed')} className="text-xs text-accent-text">Go back</button>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>{user.firstName} {user.lastName} - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <BackButton fallback="/feed" />
        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex-1">Profile</h1>
        <NavLinks />
      </div>

      <div className="max-w-2xl mx-auto w-full">

      {/* Profile card */}
      <div className="bg-card mt-2 px-4 pt-6 pb-5">
        <div className="flex flex-col items-center mb-5">
          <Avatar
            firstName={user.firstName}
            lastName={user.lastName}
            avatarUrl={user.avatarUrl}
            size="lg"
          />
        </div>
        <div className="text-center">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {user.firstName} {user.lastName}
          </h2>
          {currentUser?.id !== userId && (
            <button
              onClick={() => {
                if (!currentUser) return
                navigate(`/messages/${userId}`)
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 border border-border rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Message
            </button>
          )}
        </div>
      </div>

      {/* Bio section */}
      <div className="bg-card mt-2 px-4 py-4">
        <p className="text-[0.625rem] font-semibold text-muted uppercase tracking-wide mb-2">About</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          {user.bio || <span className="text-muted italic">No bio yet.</span>}
        </p>
      </div>

      </div>{/* end max-w-2xl */}

      <BottomNav />
    </div>
  )
}
