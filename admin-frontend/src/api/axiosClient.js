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
    if (!error.response) {
      return Promise.reject(new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.'))
    }

    const { status } = error.response
    const originalRequest = error.config
    const isAuthEndpoint = originalRequest.url?.includes('/api/auth/login') || 
                           originalRequest.url?.includes('/api/auth/register')

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
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

    if (status === 403) {
      return Promise.reject(new Error('Bạn không có quyền truy cập vào tài nguyên này.'))
    }

    if (status >= 500) {
      return Promise.reject(new Error('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.'))
    }

    return Promise.reject(error)
  }
)

export default axiosClient
