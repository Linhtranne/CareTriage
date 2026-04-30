import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../api/axiosClient'

export const ROLE_PRIORITY = {
  'SUPER_ADMIN': 100,
  'CONTENT_ADMIN': 50,
  'ADMIN': 30,
  'DOCTOR': 20,
  'PATIENT': 10
}

export const ROLE_LANDING_PAGES = {
  'SUPER_ADMIN': '/super-admin/dashboard',
  'CONTENT_ADMIN': '/content-admin/posts',
  'ADMIN': '/admin/dashboard',
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
          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          const res = await axiosClient.post('/api/auth/register', data)
          set({ isLoading: false })
          return { success: true, message: 'Đăng ký thành công' }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, message: error.response?.data?.message || 'Đăng ký thất bại' }
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      setCredentials: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true })
      },

      clearCredentials: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (newData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...newData } : newData
        }))
      },

      getRole: () => get().user?.role || null,
    }),
    { name: 'caretriage-auth' }
  )
)

export default useAuthStore
