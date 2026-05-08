import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../api/axiosClient'

export const ROLE_PRIORITY = {
  'SUPER_ADMIN': 100,
  'CONTENT_ADMIN': 50,
  'ADMIN': 30,
  'PATIENT': 10,
  'DOCTOR': 10
}

export const ROLE_LANDING_PAGES = {
  'SUPER_ADMIN': '/super-admin/dashboard',
  'CONTENT_ADMIN': '/content-admin/posts',
  'ADMIN': '/admin/dashboard'
}

export const getHighestPriorityLandingPage = (user) => {
  if (!user) return '/login'
  
  if (user.role) {
    const cleanRole = user.role.replace('ROLE_', '').toUpperCase()
    return ROLE_LANDING_PAGES[cleanRole] || '/admin/dashboard'
  }
  
  if (user.roles && user.roles.length > 0) {
    const cleanRoles = user.roles.map(r => r.replace('ROLE_', '').toUpperCase())
    const sortedRoles = [...cleanRoles].sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))
    const highestRole = sortedRoles[0]
    return ROLE_LANDING_PAGES[highestRole] || '/admin/dashboard'
  }
  
  return '/admin/dashboard'
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
          
          // Check if user has an admin role before allowing login to Admin Portal
          const userRoles = []
          if (user?.role) userRoles.push(user.role)
          if (user?.roles) userRoles.push(...user.roles)
          const cleanRoles = userRoles.map(r => r.replace('ROLE_', '').toUpperCase())
          
          const hasAdminRole = cleanRoles.some(role => ['SUPER_ADMIN', 'CONTENT_ADMIN', 'ADMIN'].includes(role))
          
          if (!hasAdminRole) {
            set({ isLoading: false })
            return { 
              success: false, 
              message: 'Tài khoản của bạn không có quyền truy cập trang quản trị. Vui lòng đăng nhập ở cổng dành cho Bác sĩ/Bệnh nhân.' 
            }
          }

          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { 
            success: false, 
            message: error.response?.data?.message || 'Đăng nhập thất bại' 
          }
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)

export default useAuthStore
