import { describe, it, expect, beforeEach, vi } from 'vitest'
import useAuthStore from '../auth-store'
import axiosClient from '../../services/http-client'

vi.mock('../../services/http-client')

describe('Admin authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset state manually since persist might keep it
    useAuthStore.setState({ 
      user: null, 
      token: null, 
      refreshToken: null, 
      isAuthenticated: false, 
      isLoading: false 
    })
  })

  it('should logout and call API', async () => {
    useAuthStore.setState({ refreshToken: 'test-refresh', isAuthenticated: true })
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: { success: true } })

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(axiosClient.post).toHaveBeenCalledWith('/api/auth/logout', { refreshToken: 'test-refresh' })
  })

  it('should logout even if API fails', async () => {
    useAuthStore.setState({ refreshToken: 'test-refresh', isAuthenticated: true })
    vi.mocked(axiosClient.post).mockRejectedValueOnce(new Error('Network error'))

    await useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().refreshToken).toBeNull()
  })
})
