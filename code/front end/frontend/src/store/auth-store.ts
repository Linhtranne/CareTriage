import { AxiosError } from 'axios'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosClient from '../services/http-client'
import { RegisterPayload, User } from '../types'

const SUPER_ADMIN_PRIORITY = 100
const CONTENT_ADMIN_PRIORITY = 50
const ADMIN_PRIORITY = 30
const DOCTOR_PRIORITY = 20
const PATIENT_PRIORITY = 10

export const ROLE_PRIORITY: Record<string, number> = {
  SUPER_ADMIN: SUPER_ADMIN_PRIORITY,
  CONTENT_ADMIN: CONTENT_ADMIN_PRIORITY,
  ADMIN: ADMIN_PRIORITY,
  DOCTOR: DOCTOR_PRIORITY,
  PATIENT: PATIENT_PRIORITY,
}

export const ROLE_LANDING_PAGES: Record<string, string> = {
  SUPER_ADMIN: 'http://localhost:5174/super-admin/dashboard',
  CONTENT_ADMIN: 'http://localhost:5174/content-admin/posts',
  ADMIN: 'http://localhost:5174/admin/dashboard',
  DOCTOR: '/doctor/dashboard',
  PATIENT: '/patient/dashboard',
}

interface AuthPayload {
  token: string;
  refreshToken: string;
  user: User;
}

interface ErrorResponse {
  message?: string;
}

interface AuthResult {
  success: boolean;
  requires2FA?: boolean;
  tempToken?: string;
  message?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<AuthResult>;
  verify2FA: (otp: string, tempToken: string) => Promise<AuthResult>;
  register: (data: RegisterPayload) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setCredentials: (user: User, token: string, refreshToken: string) => void;
  clearCredentials: () => void;
  updateUser: (newData: Partial<User>) => void;
  getRole: () => string | null;
}

const normalizeRole = (role?: string) => {
  if (!role) return ''
  return role.replace('ROLE_', '').toUpperCase()
}

const normalizeUserRole = (user: User) => ({
  ...user,
  role: user.role ? (normalizeRole(user.role) as User['role']) : undefined as unknown as User['role'],
})

const getErrorMessage = (error: any, fallbackMessage: string) => {
  if (error && error.response?.data?.message) {
    return error.response.data.message
  }
  if (error instanceof AxiosError) {
    return (error.response?.data as ErrorResponse | undefined)?.message || fallbackMessage
  }

  return fallbackMessage
}

export const getHighestPriorityLandingPage = (user: User | null): string => {
  if (!user) return '/login'

  if (user.role) {
    return ROLE_LANDING_PAGES[normalizeRole(user.role)] || '/patient/dashboard'
  }

  if (user.roles?.length) {
    const sortedRoles = user.roles
      .map(normalizeRole)
      .sort((a, b) => (ROLE_PRIORITY[b] || 0) - (ROLE_PRIORITY[a] || 0))

    return ROLE_LANDING_PAGES[sortedRoles[0]] || '/patient/dashboard'
  }

  return '/patient/dashboard'
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

          if (refreshToken === '2FA_REQUIRED') {
            set({ isLoading: false })
            return { success: true, requires2FA: true, tempToken: token }
          }

          set({ user: normalizeUserRole(user), token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error: unknown) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(error, 'Login failed') }
        }
      },

      verify2FA: async (otp, tempToken) => {
        set({ isLoading: true })
        try {
          const res = await axiosClient.post<{ data: AuthPayload }>(
            '/api/auth/2fa/verify',
            { otp },
            { headers: { Authorization: `Bearer ${tempToken}` } },
          )
          const { token, refreshToken, user } = res.data.data
          set({ user: normalizeUserRole(user), token, refreshToken, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error: unknown) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(error, 'Invalid verification code') }
        }
      },

      register: async (data) => {
        set({ isLoading: true })
        try {
          await axiosClient.post('/api/auth/register', data)
          set({ isLoading: false })
          return { success: true, message: 'Registration successful' }
        } catch (error: unknown) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(error, 'Registration failed') }
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
        set({ user: normalizeUserRole(user), token, refreshToken, isAuthenticated: true })
      },

      clearCredentials: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (newData) => {
        set((state) => {
          const updatedUser = state.user ? { ...state.user, ...newData } : (newData as User)
          return { user: normalizeUserRole(updatedUser) }
        })
      },

      getRole: () => {
        const role = get().user?.role
        return role ? normalizeRole(role) : null
      },
    }),
    { name: 'caretriage-auth' },
  ),
)

export default useAuthStore
