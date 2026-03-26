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

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
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

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(client(originalRequest))
          })
        })
      }

      originalRequest._retry = true
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
      } catch {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default client
