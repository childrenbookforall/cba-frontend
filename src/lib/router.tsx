import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Spinner from '../components/ui/Spinner'
import NotificationBar from '../components/ui/NotificationBar'

function lazyWithReload<T extends React.ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload()
      return new Promise<{ default: T }>(() => {})
    })
  )
}

// Auth pages
const LoginPage = lazyWithReload(() => import('../pages/auth/LoginPage'))
const ForgotPasswordPage = lazyWithReload(() => import('../pages/auth/ForgotPasswordPage'))
const AcceptInvitePage = lazyWithReload(() => import('../pages/auth/AcceptInvitePage'))
const ResetPasswordPage = lazyWithReload(() => import('../pages/auth/ResetPasswordPage'))

// Member pages
const FeedPage = lazyWithReload(() => import('../pages/FeedPage'))
const PostDetailPage = lazyWithReload(() => import('../pages/PostDetailPage'))
const CreatePostPage = lazyWithReload(() => import('../pages/CreatePostPage'))
const EditPostPage = lazyWithReload(() => import('../pages/EditPostPage'))
const NotificationsPage = lazyWithReload(() => import('../pages/NotificationsPage'))
const ProfilePage = lazyWithReload(() => import('../pages/ProfilePage'))
const UserProfilePage = lazyWithReload(() => import('../pages/UserProfilePage'))
const SearchPage = lazyWithReload(() => import('../pages/SearchPage'))

// Admin pages
const AdminShell = lazyWithReload(() => import('../pages/admin/AdminShell'))
const AdminUsersPage = lazyWithReload(() => import('../pages/admin/AdminUsersPage'))
const AdminGroupsPage = lazyWithReload(() => import('../pages/admin/AdminGroupsPage'))
const AdminFlagsPage = lazyWithReload(() => import('../pages/admin/AdminFlagsPage'))
const AdminNotificationPage = lazyWithReload(() => import('../pages/admin/AdminNotificationPage'))

function PageLoader() {
  return (
    <div className="min-h-svh bg-surface flex items-center justify-center">
      <Spinner />
    </div>
  )
}

function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  )
}

function ProtectedRoute() {
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

function AdminRoute() {
  const user = useAuthStore((s) => s.user)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  if (!isInitialized) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/feed" replace />
  return <SuspenseOutlet />
}

function PublicOnlyRoute() {
  const token = useAuthStore((s) => s.token)
  const isInitialized = useAuthStore((s) => s.isInitialized)
  if (!isInitialized) return <PageLoader />
  if (token) return <Navigate to="/feed" replace />
  return <SuspenseOutlet />
}

function RootLayout() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Public-only (redirect to feed if already logged in)
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
        ],
      },
      // Public (accessible regardless of auth)
      {
        element: (
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          { path: '/invite/:token', element: <AcceptInvitePage /> },
          { path: '/reset-password/:token', element: <ResetPasswordPage /> },
        ],
      },
      // Protected member routes
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/feed', element: <FeedPage /> },
          { path: '/posts/new', element: <CreatePostPage /> },
          { path: '/posts/:postId', element: <PostDetailPage /> },
          { path: '/posts/:postId/edit', element: <EditPostPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/profile/:userId', element: <UserProfilePage /> },
          { path: '/search', element: <SearchPage /> },
        ],
      },
      // Protected admin routes
      {
        element: <AdminRoute />,
        children: [
          {
            element: (
              <Suspense fallback={<PageLoader />}>
                <AdminShell />
              </Suspense>
            ),
            children: [
              { path: '/admin', element: <Navigate to="/admin/users" replace /> },
              { path: '/admin/users', element: <AdminUsersPage /> },
              { path: '/admin/groups', element: <AdminGroupsPage /> },
              { path: '/admin/flags', element: <AdminFlagsPage /> },
              { path: '/admin/notification', element: <AdminNotificationPage /> },
            ],
          },
        ],
      },
      // Default redirect
      { path: '/', element: <Navigate to="/feed" replace /> },
      { path: '*', element: <Navigate to="/feed" replace /> },
    ],
  },
])
