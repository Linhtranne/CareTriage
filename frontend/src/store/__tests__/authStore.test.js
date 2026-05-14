import { describe, it, expect, beforeEach, vi } from 'vitest'
import useAuthStore from '../authStore'
import axiosClient from '../../api/axiosClient'

vi.mock('../../api/axiosClient')

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearCredentials()
    vi.clearAllMocks()
  })

  it('should initialize with default state', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
  })

  it('should set credentials correctly', () => {
    const user = { id: 1, email: 'test@example.com' }
    const token = 'test-token'
    const refreshToken = 'test-refresh'

    useAuthStore.getState().setCredentials(user, token, refreshToken)

    const state = useAuthStore.getState()
    expect(state.user).toEqual(user)
    expect(state.token).toBe(token)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should clear credentials on logout and call API', async () => {
    useAuthStore.getState().setCredentials({ id: 1 }, 'token', 'refresh')
    axiosClient.post.mockResolvedValueOnce({ data: { success: true } })
    
    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(axiosClient.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'refresh' })
  })

  it('should clear state even if logout API fails', async () => {
    useAuthStore.getState().setCredentials({ id: 1 }, 'token', 'refresh')
    axiosClient.post.mockRejectedValueOnce(new Error('API error'))
    
    await useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('should login successfully and update state', async () => {
    const loginData = { token: 't', refreshToken: 'r', user: { email: 'e' } }
    axiosClient.post.mockResolvedValueOnce({ data: { data: loginData } })

    const result = await useAuthStore.getState().login('e', 'p')

    expect(result.success).toBe(true)
    const state = useAuthStore.getState()
    expect(state.user).toEqual(loginData.user)
    expect(state.isAuthenticated).toBe(true)
  })

  it('should handle login failure', async () => {
    axiosClient.post.mockRejectedValueOnce({ 
      response: { data: { message: 'Wrong credentials' } } 
    })

    const result = await useAuthStore.getState().login('e', 'p')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Wrong credentials')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
