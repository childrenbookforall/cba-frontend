import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './lib/router'
import { queryClient } from './lib/queryClient'
import Toaster from './components/ui/Toaster'
import InstallBanner from './components/ui/InstallBanner'
import { useInstallPromptStore } from './stores/installPromptStore'
import { useAuthStore } from './stores/authStore'
import { usePushSubscription } from './hooks/usePushSubscription'

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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
      <InstallBanner />
      <InstallPromptCapture />
      <PushSubscriptionManager />
    </QueryClientProvider>
  )
}
