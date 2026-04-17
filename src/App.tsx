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
        <div className="min-h-svh flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-semibold text-primary">Something went wrong</p>
          <button
            className="text-xs text-primary underline"
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
