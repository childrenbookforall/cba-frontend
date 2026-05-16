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

// Token refresh state (per-tab)
let isRefreshing = false
type RefreshSubscriber = (token: string | null, error?: unknown) => void
let refreshSubscribers: RefreshSubscriber[] = []

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach((cb) => cb(null, error))
  refreshSubscribers = []
}

// Cross-tab token sharing: when one tab refreshes, others pick up the new token
// without hitting the refresh endpoint again (which would fail due to token rotation).
const refreshChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('cba-token-refresh')
  : null

refreshChannel?.addEventListener('message', ({ data }) => {
  if (!data || typeof data !== 'object' || typeof data.type !== 'string') return
  const { user, setAuth, clearAuth } = useAuthStore.getState()
  if (data.type === 'done' && typeof data.token === 'string' && user) {
    setAuth(data.token, user)
    // Resolve any queued requests in this tab that were waiting
    onTokenRefreshed(data.token)
    isRefreshing = false
  } else if (data.type === 'failed') {
    // Only log out if we don't already have a fresh token from another source
    const { token: currentToken } = useAuthStore.getState()
    if (!currentToken) {
      clearAuth()
      window.location.href = '/login'
    }
  }
})

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

      const tokenAtRefreshStart = token
      originalRequest._retry = true

      // This tab is already mid-refresh — queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((newToken, err) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              resolve(client(originalRequest))
            } else {
              reject(err)
            }
          })
        })
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
        refreshChannel?.postMessage({ type: 'done', token: newToken })
        onTokenRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return client(originalRequest)
      } catch (refreshError) {
        const status = (refreshError as { response?: { status?: number } })?.response?.status
        const { token: currentToken } = useAuthStore.getState()
        // If another tab already refreshed (token changed), our failure is just token rotation — not a real logout.
        const anotherTabRefreshed = !!currentToken && currentToken !== tokenAtRefreshStart
        if ((status === 401 || status === 403) && !anotherTabRefreshed) {
          onRefreshFailed(refreshError)
          refreshChannel?.postMessage({ type: 'failed' })
          clearAuth()
          window.location.href = '/login'
        } else if (anotherTabRefreshed) {
          // Retry the original request with the token the winning tab obtained
          onRefreshFailed(refreshError) // no-op — BroadcastChannel already resolved subscribers
          originalRequest.headers.Authorization = `Bearer ${currentToken}`
          return client(originalRequest)
        } else {
          onRefreshFailed(refreshError)
        }
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default client
