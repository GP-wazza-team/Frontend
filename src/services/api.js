import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 300000,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const isAuthRoute = original.url?.includes('/auth/login') ||
                        original.url?.includes('/auth/register') ||
                        original.url?.includes('/auth/refresh')

    if (error.response?.status !== 401 || original._retry || isAuthRoute) {
      return Promise.reject(error)
    }

    const { refreshToken, setAccessToken, logout } = useAuthStore.getState()

    if (!refreshToken) {
      logout()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refresh_token: refreshToken,
      })

      useAuthStore.getState().setAuth(data.user, data.access_token, data.refresh_token)
      processQueue(null, data.access_token)
      original.headers.Authorization = `Bearer ${data.access_token}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
