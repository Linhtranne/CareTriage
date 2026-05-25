import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProtectedRoute from './protected-route'
import useAuthStore from '../../store/auth-store'
import type { User } from '../../types'

vi.mock('../../store/auth-store', () => ({
  default: vi.fn(),
}))

const useAuthStoreMock = vi.mocked(useAuthStore)

type AuthStoreState = ReturnType<typeof useAuthStore.getState>

const createAuthState = (overrides: Partial<AuthStoreState>): AuthStoreState => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  verify2FA: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  setCredentials: vi.fn(),
  clearCredentials: vi.fn(),
  updateUser: vi.fn(),
  getRole: vi.fn(),
  ...overrides,
})

const baseUser: User = {
  id: 'user-1',
  email: 'user@example.com',
  fullName: 'Test User',
  role: 'PATIENT',
  roles: ['PATIENT'],
}

describe('protected-route', () => {
  it('should redirect to login if not authenticated', () => {
    useAuthStoreMock.mockReturnValue(createAuthState({ isAuthenticated: false, user: null }))
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should allow access if authenticated', () => {
    useAuthStoreMock.mockReturnValue(createAuthState({ isAuthenticated: true, user: baseUser }))

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to 404 if role is unauthorized', () => {
    useAuthStoreMock.mockReturnValue(createAuthState({ isAuthenticated: true, user: baseUser }))

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute roles={['DOCTOR']} />}>
            <Route path="/protected" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/404" element={<div>404 Page</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('404 Page')).toBeInTheDocument()
  })
})
