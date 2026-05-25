import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../services/http-client'

export const ROLE_PRIORITY = {
  'SUPER_ADMIN': 100,
  'CONTENT_ADMIN': 50,
  'ADMIN': 30,
  'DOCTOR': 20,
  'PATIENT': 10
}

export const ROLE_LANDING_PAGES = {
  'SUPER_ADMIN': 'http://localhost:5174/super-admin/dashboard',
  'CONTENT_ADMIN': 'http://localhost:5174/content-admin/posts',
  'ADMIN': 'http://localhost:5174/admin/dashboard',
  'DOCTOR': '/doctor/dashboard',
  'PATIENT': '/patient/dashboard'
}

export const getHighestPriorityLandingPage = (user) => {
  if (!user) return '/login'
  
  if (user.role) {
    const cleanRole = user.role.replace('ROLE_', '').toUpperCase()
    return ROLE_LANDING_PAGES[cleanRole] || '/patient/dashboard'
  }
  
  if (user.roles && user.roles.length > 0) {
    const cleanRoles = user.roles.map(r => r.replace('ROLE_', '').toUpperCase())
    const sortedRoles = [...cleanRoles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))
    return ROLE_LANDING_PAGES[sortedRoles[0]] || '/patient/dashboard'
  }

  return '/patient/dashboard'
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await axiosClient.post('/api/auth/login', { email, password })
          const { token, refreshToken, user } = res.data.data
          
          if (refreshToken === '2FA_REQUIRED') {
            set({ isLoading: false })
            return { success: true, requires2FA: true, tempToken: token }
          }
          
          if (user && user.role) {
            user.role = user.role.replace('ROLE_', '').toUpperCase()
          }
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' }
        }
      },

      verify2FA: async (otp, tempToken) => {
        set({ isLoading: true })
        try {
          const res = await axiosClient.post('/api/auth/2fa/verify', { otp }, {
            headers: { Authorization: `Bearer ${tempToken}` }
          })
          const { token, refreshToken, user } = res.data.data
          if (user && user.role) {
            user.role = user.role.replace('ROLE_', '').toUpperCase()
          }
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: error.response?.data?.message || 'Mã xác thực không hợp lệ' }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          await axiosClient.post('/api/auth/register', data)
          set({ isLoading: false })
          return { success: true, message: 'Đăng ký thành công' }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: error.response?.data?.message || 'Đăng ký thất bại' }
        }
      },

      logout: async () => {
        const refreshToken = get().refreshToken
        if (refreshToken) {
          try {
            await axiosClient.post('/api/auth/logout', { refreshToken })
          } catch (error) {
            console.error('Logout API failed:', error)
          }
        }
        get().clearCredentials()
      },

      setCredentials: (user, token, refreshToken) => {
        if (user && user.role) {
          user.role = user.role.replace('ROLE_', '').toUpperCase()
        }
        set({ user, token, refreshToken, isAuthenticated: true })
      },

      clearCredentials: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (newData) => {
        if (newData && newData.role) {
          newData.role = newData.role.replace('ROLE_', '').toUpperCase()
        }
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...newData } : newData
          if (updatedUser && updatedUser.role) {
            updatedUser.role = updatedUser.role.replace('ROLE_', '').toUpperCase()
          }
          return { user: updatedUser }
        })
      },

      getRole: () => {
        const role = get().user?.role
        return role ? role.replace('ROLE_', '').toUpperCase() : null
      },
    }),
    { name: 'caretriage-auth' }
  )
)

export default useAuthStore
