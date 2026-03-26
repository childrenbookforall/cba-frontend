import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastStore {
  toasts: Toast[]
  toast: (message: string, type?: 'success' | 'error') => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  toast: (message, type = 'success') => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export function useToast() {
  return useToastStore((s) => s.toast)
}
