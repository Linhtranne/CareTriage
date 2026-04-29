import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../api/axiosClient'

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

      getRole: () => get().user?.role || null,
    }),
    { name: 'caretriage-auth' }
  )
)

export default useAuthStore
