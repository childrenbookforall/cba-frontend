import { Suspense } from 'react'
import { Navigate, Outlet, ScrollRestoration } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Spinner from '../components/ui/Spinner'
import NotificationBar from '../components/ui/NotificationBar'

export function PageLoader() {
  return (
    <div className="min-h-svh bg-surface flex items-center justify-center">
      <Spinner />
    </div>
  )
}

export function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  if (!isInitialized) return <PageLoader />
  if (!token) return <Navigate to="/login" replace />
  return (
    <>
      <NotificationBar />
      <SuspenseOutlet />
    </>
  )
}

export function AdminRoute() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  if (!isInitialized) return <PageLoader />
  if (!token || !user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/feed" replace />
  return <SuspenseOutlet />
}

export function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  if (!isInitialized) return <PageLoader />
  if (token) return <Navigate to="/feed" replace />
  return <SuspenseOutlet />
}

export function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}
