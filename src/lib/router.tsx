import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Spinner from '../components/ui/Spinner'

// Auth pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const AcceptInvitePage = lazy(() => import('../pages/auth/AcceptInvitePage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))

// Member pages
const FeedPage = lazy(() => import('../pages/FeedPage'))
const PostDetailPage = lazy(() => import('../pages/PostDetailPage'))
const CreatePostPage = lazy(() => import('../pages/CreatePostPage'))
const EditPostPage = lazy(() => import('../pages/EditPostPage'))
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const UserProfilePage = lazy(() => import('../pages/UserProfilePage'))
const SearchPage = lazy(() => import('../pages/SearchPage'))

// Admin pages
const AdminShell = lazy(() => import('../pages/admin/AdminShell'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const AdminGroupsPage = lazy(() => import('../pages/admin/AdminGroupsPage'))
const AdminFlagsPage = lazy(() => import('../pages/admin/AdminFlagsPage'))

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
  return <SuspenseOutlet />
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

export const router = createBrowserRouter([
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
        ],
      },
    ],
  },
  // Default redirect
  { path: '/', element: <Navigate to="/feed" replace /> },
  { path: '*', element: <Navigate to="/feed" replace /> },
])
