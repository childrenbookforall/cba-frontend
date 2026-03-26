import { create } from 'zustand'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallPromptStore {
  deferredPrompt: BeforeInstallPromptEvent | null
  triggered: boolean
  setDeferredPrompt: (e: BeforeInstallPromptEvent) => void
  trigger: () => void
  dismiss: () => void
  install: () => Promise<void>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

export const useInstallPromptStore = create<InstallPromptStore>((set, get) => ({
  deferredPrompt: null,
  triggered: false,

  setDeferredPrompt: (e) => set({ deferredPrompt: e }),

  trigger: () => {
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return
    set({ triggered: true })
  },

  dismiss: () => {
    localStorage.setItem(DISMISSED_KEY, 'true')
    set({ triggered: false })
  },

  install: async () => {
    const { deferredPrompt } = get()
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, 'true')
    }
    set({ deferredPrompt: null, triggered: false })
  },
}))
