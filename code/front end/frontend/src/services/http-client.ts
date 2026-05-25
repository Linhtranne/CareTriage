import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import useAuthStore from '../store/auth-store'

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface FailedRequest {
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor - attach JWT
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: FailedRequest[] = []

const processQueue = (error: any, token: string | null = null) => {
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
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomAxiosRequestConfig

    if (!originalRequest) return Promise.reject(error);

    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') || 
                           originalRequest.url?.includes('/api/auth/register')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<string | null>(function (resolve, reject) {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token
            }
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

          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken
          }
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
