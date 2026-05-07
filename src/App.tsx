import { useEffect, Component, type ReactNode } from 'react'
import axios from 'axios'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './lib/router'
import { queryClient } from './lib/queryClient'
import Toaster from './components/ui/Toaster'
import InstallBanner from './components/ui/InstallBanner'
import { useInstallPromptStore } from './stores/installPromptStore'
import { useAuthStore } from './stores/authStore'
import { usePushSubscription } from './hooks/usePushSubscription'
import { useThemeStore } from './stores/themeStore'

function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-4 p-8 text-center bg-surface">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-danger" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Something went wrong</p>
            <p className="text-xs text-muted">An unexpected error occurred. Reload the app to continue.</p>
          </div>
          <button
            className="px-5 py-2 bg-accent text-white text-xs font-semibold rounded-full"
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
          >
            Reload app
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// On every page load the token is gone (not persisted to localStorage).
// If a user session exists, silently exchange the httpOnly refresh cookie for a new token.
function AuthInitializer() {
  const { user, token, setAuth, clearAuth, setInitialized } = useAuthStore()

  useEffect(() => {
    if (user && !token) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true })
        .then((res) => { setAuth(res.data.token, user); setInitialized() })
        .catch(() => { clearAuth(); setInitialized() })
    } else {
      setInitialized()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

function PushSubscriptionManager() {
  const token = useAuthStore((s) => s.token)
  usePushSubscription(!!token)
  return null
}

function InstallPromptCapture() {
  const setDeferredPrompt = useInstallPromptStore((s) => s.setDeferredPrompt)

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as any)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setDeferredPrompt])

  return null
}

function GoatCounter() {
  useEffect(() => {
    return router.subscribe((state) => {
      const gc = (window as any).goatcounter
      if (typeof gc?.count === 'function') {
        gc.count({ path: state.location.pathname + state.location.search })
      }
    })
  }, [])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <Toaster />
      <InstallBanner />
      <AuthInitializer />
      <InstallPromptCapture />
      <PushSubscriptionManager />
      <GoatCounter />
      <ThemeApplier />
    </QueryClientProvider>
  )
}
