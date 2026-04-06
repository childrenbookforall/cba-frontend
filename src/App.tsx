import { useEffect, Component, type ReactNode } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './lib/router'
import { queryClient } from './lib/queryClient'
import Toaster from './components/ui/Toaster'
import InstallBanner from './components/ui/InstallBanner'
import { useInstallPromptStore } from './stores/installPromptStore'
import { useAuthStore } from './stores/authStore'
import { usePushSubscription } from './hooks/usePushSubscription'

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-svh flex flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="text-sm font-semibold text-gray-900">Something went wrong</p>
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
      <InstallPromptCapture />
      <PushSubscriptionManager />
      <GoatCounter />
    </QueryClientProvider>
  )
}
