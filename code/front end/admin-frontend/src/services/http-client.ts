import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import useAuthStore from '../store/auth-store'

const REQUEST_TIMEOUT_MS = 15000
const UNAUTHORIZED_STATUS = 401
const FORBIDDEN_STATUS = 403
const SERVER_ERROR_STATUS = 500

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshPayload {
  token: string;
  refreshToken: string;
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to the server. Check your internet connection.'))
    }

    const { status } = error.response
    const originalRequest = error.config as RetryAxiosRequestConfig | undefined
    if (!originalRequest) return Promise.reject(error)

    const isAuthEndpoint =
      originalRequest.url?.includes('/api/auth/login') || originalRequest.url?.includes('/api/auth/register')

    if (status === UNAUTHORIZED_STATUS && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const refreshUrl = `${axiosClient.defaults.baseURL || ''}/api/auth/refresh`
          const res = await axios.post<{ data: RefreshPayload }>(refreshUrl, { refreshToken })
          const { token: newToken, refreshToken: newRefreshToken } = res.data.data

          useAuthStore.setState({
            token: newToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          })

          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return axiosClient(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      useAuthStore.getState().logout()
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    if (status === FORBIDDEN_STATUS) {
      return Promise.reject(new Error('You do not have permission to access this resource.'))
    }

    if (status >= SERVER_ERROR_STATUS) {
      return Promise.reject(new Error('The system is temporarily unavailable. Try again later.'))
    }

    return Promise.reject(error)
  },
)

export default axiosClient
