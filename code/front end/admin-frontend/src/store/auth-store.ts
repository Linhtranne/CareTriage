import { AxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../services/http-client'
import { User } from '../types'

const SUPER_ADMIN_PRIORITY = 100
const CONTENT_ADMIN_PRIORITY = 50
const ADMIN_PRIORITY = 30
const PORTAL_ROLE_PRIORITY = 10

type AdminRole = 'SUPER_ADMIN' | 'CONTENT_ADMIN' | 'ADMIN'

export const ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN: SUPER_ADMIN_PRIORITY,
  CONTENT_ADMIN: CONTENT_ADMIN_PRIORITY,
  ADMIN: ADMIN_PRIORITY,
  PATIENT: PORTAL_ROLE_PRIORITY,
  DOCTOR: PORTAL_ROLE_PRIORITY,
}

export const ROLE_LANDING_PAGES: Record<AdminRole, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  CONTENT_ADMIN: '/content-admin/posts',
  ADMIN: '/admin/dashboard',
}

interface AuthPayload {
  token: string;
  refreshToken: string;
  user: User & { role?: string; roles?: string[] };
}

interface ErrorResponse {
  message?: string;
}

interface AuthResult {
  success: boolean;
  message?: string;
}

interface AuthState {
  user: AuthPayload['user'] | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const ADMIN_ROLES: AdminRole[] = ['SUPER_ADMIN', 'CONTENT_ADMIN', 'ADMIN']

const normalizeRole = (role: string) => role.replace('ROLE_', '').toUpperCase()

const getUserRoles = (user: AuthPayload['user']) => {
  const roles: string[] = []
  if (user.role) roles.push(user.role)
  if (user.roles) roles.push(...user.roles)
  return roles.map(normalizeRole)
}

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ErrorResponse | undefined)?.message || fallbackMessage
  }

  return fallbackMessage
}

export const getHighestPriorityLandingPage = (user: AuthPayload['user'] | null) => {
  if (!user) return '/login'

  const sortedRoles = getUserRoles(user).sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))
  const highestRole = sortedRoles.find((role): role is AdminRole => ADMIN_ROLES.includes(role as AdminRole))

  return highestRole ? ROLE_LANDING_PAGES[highestRole] : '/admin/dashboard'
}

const useAuthStore = create<AuthState>()(
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
          const res = await axiosClient.post<{ data: AuthPayload }>('/api/auth/login', { email, password })
          const { token, refreshToken, user } = res.data.data
          const hasAdminRole = getUserRoles(user).some((role) => ADMIN_ROLES.includes(role as AdminRole))

          if (!hasAdminRole) {
            set({ isLoading: false })
            return {
              success: false,
              message: 'This account cannot access the admin portal.',
            }
          }

          set({ user, token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error: unknown) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(error, 'Login failed') }
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
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        localStorage.removeItem('auth-storage')
      },
    }),
    { name: 'auth-storage' },
  ),
)

export default useAuthStore
