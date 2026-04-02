import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // send httpOnly refresh token cookie on every request
})

// Attach JWT to every request
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Token refresh state
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const REFRESH_LOCK_KEY = 'cba-token-refreshing'
const REFRESH_LOCK_TIMEOUT_MS = 10000
// Unique ID for this tab — used to detect whether we own the refresh lock
const TAB_ID = Math.random().toString(36).slice(2)

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function acquireRefreshLock(): boolean {
  const lockValue = JSON.stringify({ tabId: TAB_ID, ts: Date.now() })
  localStorage.setItem(REFRESH_LOCK_KEY, lockValue)
  // Read back to confirm we were the last writer (last-write-wins)
  try {
    const stored = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) ?? '{}')
    return stored.tabId === TAB_ID
  } catch {
    return false
  }
}

function isAnotherTabRefreshing(): boolean {
  try {
    const stored = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) ?? 'null')
    if (!stored) return false
    if (stored.tabId === TAB_ID) return false // We hold the lock
    return Date.now() - Number(stored.ts) < REFRESH_LOCK_TIMEOUT_MS
  } catch {
    return false
  }
}

// Wait for another tab to finish refreshing and return the new token from localStorage.
// Resolves with the new token, or rejects after timeout.
function waitForTokenFromOtherTab(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      window.removeEventListener('storage', handler)
      reject(new Error('Cross-tab refresh timeout'))
    }, REFRESH_LOCK_TIMEOUT_MS)

    function handler(event: StorageEvent) {
      if (event.key === 'cba-auth') {
        clearTimeout(timeout)
        window.removeEventListener('storage', handler)
        try {
          const state = JSON.parse(event.newValue ?? '{}')
          const token = state?.state?.token
          if (token) resolve(token)
          else reject(new Error('No token in storage event'))
        } catch {
          reject(new Error('Failed to parse storage event'))
        }
      }
    }

    window.addEventListener('storage', handler)
  })
}

// On 401: if a token exists, try to refresh silently and retry the request.
// If refresh fails, clear auth and redirect to login.
// If no token exists, the 401 is an expected auth failure (e.g. wrong password)
// and should be handled by the calling page.
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const { token, user, setAuth, clearAuth } = useAuthStore.getState()
      if (!token) return Promise.reject(error)

      originalRequest._retry = true

      // Another tab in this browser is already refreshing — wait for its result
      if (isAnotherTabRefreshing()) {
        try {
          const newToken = await waitForTokenFromOtherTab()
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return client(originalRequest)
        } catch {
          // Cross-tab refresh timed out — don't logout, just fail the request
          return Promise.reject(error)
        }
      }

      // This tab is already mid-refresh — queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(client(originalRequest))
          })
        })
      }

      if (!acquireRefreshLock()) {
        // Another tab wrote the lock between our check and our write — wait for it
        try {
          const newToken = await waitForTokenFromOtherTab()
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return client(originalRequest)
        } catch {
          return Promise.reject(error)
        }
      }

      isRefreshing = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data.token
        setAuth(newToken, user!)
        onTokenRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch (refreshError) {
        refreshSubscribers = []
        // Only clear auth if the refresh token is definitively invalid.
        // Network errors or server errors should not log the user out.
        const status = (refreshError as any)?.response?.status
        if (status === 401 || status === 403) {
          clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
        localStorage.removeItem(REFRESH_LOCK_KEY)
      }
    }

    return Promise.reject(error)
  }
)

export default client
