import axios from 'axios'
import useAuthStore from '../store/authStore'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') || 
                           originalRequest.url?.includes('/api/auth/register')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const refreshUrl = `${axiosClient.defaults.baseURL || ''}/api/auth/refresh`
          const res = await axios.post(refreshUrl, { refreshToken })
          const { token: newToken, refreshToken: newRefreshToken } = res.data.data
          
          useAuthStore.setState({
            token: newToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          })

          originalRequest.headers['Authorization'] = 'Bearer ' + newToken
          return axiosClient(originalRequest)
        } catch (refreshError) {
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
