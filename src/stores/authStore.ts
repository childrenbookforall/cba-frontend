import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/api'

interface AuthState {
  token: string | null
  user: User | null
  isInitialized: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
  setInitialized: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isInitialized: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setInitialized: () => set({ isInitialized: true }),
    }),
    {
      name: 'cba-auth',
      // Only persist the user profile — never the token.
      // On page reload the token is recovered via the httpOnly refresh cookie.
      partialize: (state) => ({ user: state.user }),
    }
  )
)
