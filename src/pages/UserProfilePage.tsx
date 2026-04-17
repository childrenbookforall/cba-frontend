import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getUserById } from '../api/users'
import Avatar from '../components/ui/Avatar'
import Spinner from '../components/ui/Spinner'
import BottomNav from '../components/layout/BottomNav'
import NavLinks from '../components/layout/NavLinks'

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId!),
    enabled: !!userId,
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
        <button onClick={() => navigate(-1)} className="text-xs text-accent">Go back</button>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-surface flex flex-col pb-20 sm:pb-0">
      <title>{user.firstName} {user.lastName} - CBA</title>

      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
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
