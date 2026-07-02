import { useEffect, Component, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
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
            <AlertCircle className="w-6 h-6 text-danger" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Something went wrong</p>
            <p className="text-xs text-muted">An unexpected error occurred. Reload the app to continue.</p>
          </div>
          <button
            className="px-5 py-2 bg-accent text-accent-text-fg text-xs font-semibold rounded-full"
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
let refreshAttempted = false

function AuthInitializer() {
  const { user, token, setAuth, clearAuth, setInitialized } = useAuthStore()

  useEffect(() => {
    if (refreshAttempted) return
    refreshAttempted = true

    if (user && !token) {
      axios
        .post(`${import.meta.env.VITE_API_URL}/api/auth/refresh`, {}, { withCredentials: true })
        .then((res) => { setAuth(res.data.token, user); setInitialized() })
        .catch((err) => {
          const status = err?.response?.status
          const { token: currentToken } = useAuthStore.getState()
          // Don't clear auth if another tab already refreshed the token while we were trying
          if ((status === 401 || status === 403) && !currentToken) clearAuth()
          setInitialized()
        })
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
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [setDeferredPrompt])

  return null
}

function GoatCounter() {
  useEffect(() => {
    return router.subscribe((state) => {
      const gc = window.goatcounter
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
