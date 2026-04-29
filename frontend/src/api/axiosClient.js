import axios from 'axios'
import useAuthStore from '../store/authStore'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach JWT
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor - handle 401 & silent token refresh
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') || 
                           originalRequest.url?.includes('/api/auth/register')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return axiosClient(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const refreshUrl = `${axiosClient.defaults.baseURL || ''}/api/auth/refresh`
          const res = await axios.post(refreshUrl, {
            refreshToken: refreshToken,
          })
          const { token: newToken, refreshToken: newRefreshToken } = res.data.data
          
          useAuthStore.setState({
            token: newToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          })

          processQueue(null, newToken)
          isRefreshing = false

          originalRequest.headers['Authorization'] = 'Bearer ' + newToken
          return axiosClient(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          isRefreshing = false
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        useAuthStore.getState().logout()
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default axiosClient
